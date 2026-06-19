-- New members start at 0 balance; deposit 5,000 FCFA to activate (reserve floor)
-- Requires 20240619000006_account_status_pending.sql (enum value committed first)

ALTER TABLE public.savings_accounts DROP CONSTRAINT IF EXISTS balance_meets_reserve;
ALTER TABLE public.savings_accounts ADD CONSTRAINT balance_meets_reserve CHECK (
  (status = 'pending' AND balance >= 0)
  OR (status IN ('active', 'suspended', 'closed') AND balance >= reserve_balance)
);

ALTER TABLE public.savings_accounts ALTER COLUMN balance SET DEFAULT 0;
ALTER TABLE public.savings_accounts ALTER COLUMN status SET DEFAULT 'pending';

-- New user provisioning: zero balance, pending activation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email
  );
  INSERT INTO public.savings_accounts (user_id, balance, reserve_balance, status)
  VALUES (NEW.id, 0.00, 5000.00, 'pending');
  INSERT INTO public.discipline_scores (user_id, points, level)
  VALUES (NEW.id, 0, 'bronze');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Reset saver accounts that only had the old free 5,000 signup balance
UPDATE public.savings_accounts sa
SET balance = 0, status = 'pending'
WHERE sa.status = 'active'
  AND sa.balance = 5000
  AND sa.reserve_balance = 5000
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.user_id = sa.user_id AND t.transaction_type = 'deposit'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = sa.user_id AND p.role = 'admin'
  );

-- Deposit funds: activate account when balance reaches reserve floor
CREATE OR REPLACE FUNCTION app.deposit_funds(
  p_user_id UUID,
  p_goal_id UUID,
  p_amount NUMERIC,
  p_deposit_request_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_goal public.savings_goals%ROWTYPE;
  v_account public.savings_accounts%ROWTYPE;
  v_tx_id UUID;
  v_current_month DATE;
  v_was_pending BOOLEAN;
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

  SELECT * INTO v_account FROM public.savings_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  v_was_pending := v_account.status = 'pending';

  IF v_was_pending AND (v_account.balance + p_amount) < v_account.reserve_balance THEN
    RAISE EXCEPTION 'A minimum deposit of 5,000 FCFA is required to activate your account.';
  END IF;

  UPDATE public.savings_accounts
  SET balance = balance + p_amount,
      status = CASE
        WHEN status = 'pending' AND (balance + p_amount) >= reserve_balance THEN 'active'::public.account_status
        ELSE status
      END
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

  IF v_was_pending AND (v_account.balance + p_amount) >= v_account.reserve_balance THEN
    PERFORM app.create_notification(
      p_user_id,
      'Account Activated',
      'Your account is now active. Your 5,000 FCFA reserve balance is secured and your savings can begin.'
    );
  END IF;

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

-- Block withdrawals until account is active
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

  SELECT * INTO v_account FROM public.savings_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  IF v_account.status = 'pending' THEN
    RAISE EXCEPTION 'Your account is not active. Please deposit 5,000 FCFA to activate your account.';
  END IF;

  SELECT * INTO v_goal FROM public.savings_goals
  WHERE id = p_goal_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  IF p_amount > v_goal.current_amount THEN
    RAISE EXCEPTION 'Insufficient goal balance';
  END IF;

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

-- Dashboard metrics include account status
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_account public.savings_accounts%ROWTYPE;
  v_result JSON;
  v_is_active BOOLEAN;
BEGIN
  SELECT * INTO v_account FROM public.savings_accounts WHERE user_id = v_user_id;
  v_is_active := v_account.status = 'active';

  SELECT json_build_object(
    'account_balance', COALESCE(v_account.balance, 0),
    'reserve_balance', COALESCE(v_account.reserve_balance, 5000),
    'account_status', COALESCE(v_account.status::TEXT, 'pending'),
    'is_active', v_is_active,
    'activation_required', COALESCE(v_account.status = 'pending', true),
    'activation_remaining', GREATEST(0, COALESCE(v_account.reserve_balance, 5000) - COALESCE(v_account.balance, 0)),
    'max_withdrawable', CASE WHEN v_is_active THEN GREATEST(0, COALESCE(v_account.balance, 0) - COALESCE(v_account.reserve_balance, 5000)) ELSE 0 END,
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
