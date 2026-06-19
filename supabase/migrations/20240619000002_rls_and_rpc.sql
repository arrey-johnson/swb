-- RLS Policies and RPC Functions

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Savings accounts policies
CREATE POLICY "Users can view own account" ON public.savings_accounts
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Savings goals policies
CREATE POLICY "Users can view own goals" ON public.savings_goals
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
-- Goals are created only via RPC (create_goal), not direct INSERT

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Deposit requests policies
CREATE POLICY "Users can view own deposit requests" ON public.deposit_requests
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own deposit requests" ON public.deposit_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Penalty settings policies
CREATE POLICY "Anyone authenticated can read penalties" ON public.penalty_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage penalties" ON public.penalty_settings
  FOR ALL USING (public.is_admin());

-- Platform settings policies
CREATE POLICY "Authenticated users can read platform settings" ON public.platform_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
  FOR ALL USING (public.is_admin());

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- Discipline scores policies
CREATE POLICY "Users can view own discipline score" ON public.discipline_scores
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- ============================================
-- RPC FUNCTIONS (app schema)
-- ============================================

-- Create notification
CREATE OR REPLACE FUNCTION app.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, body)
  VALUES (p_user_id, p_title, p_body)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Adjust discipline score
CREATE OR REPLACE FUNCTION app.adjust_discipline(
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_new_points INTEGER;
BEGIN
  UPDATE public.discipline_scores
  SET points = GREATEST(0, points + p_delta),
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING points INTO v_new_points;

  UPDATE public.discipline_scores
  SET level = app.calculate_discipline_level(v_new_points)
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create goal
CREATE OR REPLACE FUNCTION app.create_goal(
  p_user_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_target_amount NUMERIC,
  p_duration_months INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_maturity DATE;
BEGIN
  IF p_duration_months NOT IN (3, 6, 12) THEN
    RAISE EXCEPTION 'Duration must be 3, 6, or 12 months';
  END IF;
  IF p_target_amount <= 0 THEN
    RAISE EXCEPTION 'Target amount must be positive';
  END IF;

  v_maturity := (CURRENT_DATE + (p_duration_months || ' months')::INTERVAL)::DATE;

  INSERT INTO public.savings_goals (
    user_id, title, description, target_amount, duration_months, maturity_date
  ) VALUES (
    p_user_id, p_title, p_description, p_target_amount, p_duration_months, v_maturity
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Calculate penalty
CREATE OR REPLACE FUNCTION app.calculate_penalty(
  p_goal_id UUID,
  p_amount NUMERIC
)
RETURNS TABLE (
  penalty_amount NUMERIC,
  penalty_percentage NUMERIC,
  is_early BOOLEAN,
  net_amount NUMERIC
) AS $$
DECLARE
  v_goal public.savings_goals%ROWTYPE;
  v_pct NUMERIC;
BEGIN
  SELECT * INTO v_goal FROM public.savings_goals WHERE id = p_goal_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  IF v_goal.status IN ('matured', 'completed') OR v_goal.maturity_date <= CURRENT_DATE THEN
    penalty_amount := 0;
    penalty_percentage := 0;
    is_early := FALSE;
    net_amount := p_amount;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT percentage INTO v_pct FROM public.penalty_settings
  WHERE duration_months = v_goal.duration_months;

  penalty_amount := ROUND(p_amount * COALESCE(v_pct, 0) / 100, 2);
  penalty_percentage := COALESCE(v_pct, 0);
  is_early := TRUE;
  net_amount := p_amount - penalty_amount;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get withdrawable amount
CREATE OR REPLACE FUNCTION app.get_withdrawable_amount(p_user_id UUID)
RETURNS TABLE (
  account_balance NUMERIC,
  reserve_balance NUMERIC,
  max_withdrawable NUMERIC,
  total_locked NUMERIC
) AS $$
DECLARE
  v_account public.savings_accounts%ROWTYPE;
  v_locked NUMERIC;
BEGIN
  SELECT * INTO v_account FROM public.savings_accounts WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  SELECT COALESCE(SUM(current_amount), 0) INTO v_locked
  FROM public.savings_goals
  WHERE user_id = p_user_id AND status IN ('active', 'matured');

  account_balance := v_account.balance;
  reserve_balance := v_account.reserve_balance;
  max_withdrawable := GREATEST(0, v_account.balance - v_account.reserve_balance);
  total_locked := v_locked;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Deposit funds (called after admin approval)
CREATE OR REPLACE FUNCTION app.deposit_funds(
  p_user_id UUID,
  p_goal_id UUID,
  p_amount NUMERIC,
  p_deposit_request_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_goal public.savings_goals%ROWTYPE;
  v_tx_id UUID;
  v_current_month DATE;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Deposit amount must be positive';
  END IF;

  SELECT * INTO v_goal FROM public.savings_goals
  WHERE id = p_goal_id AND user_id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  PERFORM 1 FROM public.savings_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  UPDATE public.savings_accounts
  SET balance = balance + p_amount
  WHERE user_id = p_user_id;

  UPDATE public.savings_goals
  SET current_amount = current_amount + p_amount
  WHERE id = p_goal_id;

  INSERT INTO public.transactions (user_id, goal_id, amount, transaction_type, description)
  VALUES (p_user_id, p_goal_id, p_amount, 'deposit', 'Deposit to goal: ' || v_goal.title)
  RETURNING id INTO v_tx_id;

  IF p_deposit_request_id IS NOT NULL THEN
    UPDATE public.deposit_requests
    SET status = 'approved', reviewed_at = NOW()
    WHERE id = p_deposit_request_id AND user_id = p_user_id;
  END IF;

  -- Consistent deposit bonus: +20 if first deposit this calendar month
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  UPDATE public.discipline_scores
  SET last_deposit_month = v_current_month,
      points = CASE
        WHEN last_deposit_month IS NULL OR last_deposit_month < v_current_month
        THEN points + 20 ELSE points END,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE public.discipline_scores
  SET level = app.calculate_discipline_level(points)
  WHERE user_id = p_user_id;

  PERFORM app.create_notification(
    p_user_id,
    'Deposit Successful',
    'Your deposit of ' || p_amount || ' FCFA to ' || v_goal.title || ' has been confirmed.'
  );

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Withdraw funds
CREATE OR REPLACE FUNCTION app.withdraw_funds(
  p_user_id UUID,
  p_goal_id UUID,
  p_amount NUMERIC
)
RETURNS UUID AS $$
DECLARE
  v_goal public.savings_goals%ROWTYPE;
  v_account public.savings_accounts%ROWTYPE;
  v_penalty RECORD;
  v_withdrawal_id UUID;
  v_is_early BOOLEAN;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be positive';
  END IF;

  SELECT * INTO v_goal FROM public.savings_goals
  WHERE id = p_goal_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  IF p_amount > v_goal.current_amount THEN
    RAISE EXCEPTION 'Insufficient goal balance';
  END IF;

  SELECT * INTO v_account FROM public.savings_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  IF p_amount > (v_account.balance - v_account.reserve_balance) THEN
    RAISE EXCEPTION 'Your account must maintain the required 5,000 FCFA reserve balance.';
  END IF;

  SELECT * INTO v_penalty FROM app.calculate_penalty(p_goal_id, p_amount);
  v_is_early := v_penalty.is_early;

  UPDATE public.savings_goals
  SET current_amount = current_amount - p_amount,
      status = CASE WHEN v_is_early THEN 'withdrawn_early'::public.goal_status ELSE status END
  WHERE id = p_goal_id;

  UPDATE public.savings_accounts
  SET balance = balance - p_amount
  WHERE user_id = p_user_id;

  INSERT INTO public.withdrawals (user_id, goal_id, amount, penalty_amount, net_amount, is_early)
  VALUES (p_user_id, p_goal_id, p_amount, v_penalty.penalty_amount, v_penalty.net_amount, v_is_early)
  RETURNING id INTO v_withdrawal_id;

  INSERT INTO public.transactions (user_id, goal_id, amount, transaction_type, description)
  VALUES (p_user_id, p_goal_id, p_amount, 'withdrawal',
    'Withdrawal from goal: ' || v_goal.title);

  IF v_penalty.penalty_amount > 0 THEN
    INSERT INTO public.transactions (user_id, goal_id, amount, transaction_type, description)
    VALUES (p_user_id, p_goal_id, v_penalty.penalty_amount, 'penalty',
      'Early withdrawal penalty on: ' || v_goal.title);
    PERFORM app.create_notification(
      p_user_id, 'Penalty Charged',
      'A penalty of ' || v_penalty.penalty_amount || ' FCFA was applied to your early withdrawal.'
    );
    PERFORM app.adjust_discipline(p_user_id, -50, 'early_withdrawal');
  END IF;

  PERFORM app.create_notification(
    p_user_id, 'Withdrawal Successful',
    'You withdrew ' || v_penalty.net_amount || ' FCFA from ' || v_goal.title || '.'
  );

  RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check maturity
CREATE OR REPLACE FUNCTION app.check_maturity()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_goal RECORD;
BEGIN
  FOR v_goal IN
    SELECT * FROM public.savings_goals
    WHERE status = 'active' AND maturity_date <= CURRENT_DATE
    FOR UPDATE
  LOOP
    UPDATE public.savings_goals SET status = 'matured' WHERE id = v_goal.id;
    PERFORM app.create_notification(
      v_goal.user_id,
      'Goal Matured',
      'Your savings goal "' || v_goal.title || '" has reached maturity. You can now withdraw without penalties.'
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Complete goal
CREATE OR REPLACE FUNCTION app.complete_goal(p_goal_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_goal public.savings_goals%ROWTYPE;
BEGIN
  SELECT * INTO v_goal FROM public.savings_goals
  WHERE id = p_goal_id AND user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  IF v_goal.status NOT IN ('matured', 'active') THEN
    RAISE EXCEPTION 'Goal cannot be completed in current status';
  END IF;

  IF v_goal.status = 'active' AND v_goal.maturity_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Goal has not matured yet';
  END IF;

  UPDATE public.savings_goals SET status = 'completed' WHERE id = p_goal_id;

  PERFORM app.adjust_discipline(p_user_id, 100, 'goal_completed');
  PERFORM app.create_notification(
    p_user_id, 'Goal Completed',
    'Congratulations! You completed your savings goal "' || v_goal.title || '".'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Dashboard metrics RPC (read-only, for authenticated users)
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_account public.savings_accounts%ROWTYPE;
  v_result JSON;
BEGIN
  SELECT * INTO v_account FROM public.savings_accounts WHERE user_id = v_user_id;

  SELECT json_build_object(
    'account_balance', COALESCE(v_account.balance, 0),
    'reserve_balance', COALESCE(v_account.reserve_balance, 5000),
    'max_withdrawable', GREATEST(0, COALESCE(v_account.balance, 0) - COALESCE(v_account.reserve_balance, 5000)),
    'total_locked', COALESCE((
      SELECT SUM(current_amount) FROM public.savings_goals
      WHERE user_id = v_user_id AND status IN ('active', 'matured')
    ), 0),
    'active_goals', (
      SELECT COUNT(*) FROM public.savings_goals
      WHERE user_id = v_user_id AND status = 'active'
    ),
    'completed_goals', (
      SELECT COUNT(*) FROM public.savings_goals
      WHERE user_id = v_user_id AND status = 'completed'
    ),
    'next_maturity', (
      SELECT MIN(maturity_date) FROM public.savings_goals
      WHERE user_id = v_user_id AND status = 'active'
    ),
    'discipline_points', COALESCE((
      SELECT points FROM public.discipline_scores WHERE user_id = v_user_id
    ), 0),
    'discipline_level', COALESCE((
      SELECT level::TEXT FROM public.discipline_scores WHERE user_id = v_user_id
    ), 'bronze')
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Admin metrics
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS JSON AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_users', (SELECT COUNT(*) FROM public.profiles WHERE role = 'saver'),
      'total_savings', (SELECT COALESCE(SUM(balance), 0) FROM public.savings_accounts),
      'total_deposits', (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE transaction_type = 'deposit'),
      'total_withdrawals', (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE transaction_type = 'withdrawal'),
      'total_penalties', (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE transaction_type = 'penalty'),
      'active_goals', (SELECT COUNT(*) FROM public.savings_goals WHERE status = 'active'),
      'matured_goals', (SELECT COUNT(*) FROM public.savings_goals WHERE status = 'matured'),
      'pending_deposits', (SELECT COUNT(*) FROM public.deposit_requests WHERE status = 'pending')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Grant execute on public RPCs
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Storage bucket for deposit proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('deposit-proofs', 'deposit-proofs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own deposit proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'deposit-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

CREATE POLICY "Users can view own deposit proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'deposit-proofs' AND
  ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_admin())
);
