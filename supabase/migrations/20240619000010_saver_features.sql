-- Saver-facing features: payout tracking, notification links, goal management, account guards

ALTER TYPE public.goal_status ADD VALUE IF NOT EXISTS 'cancelled';

CREATE TYPE public.payout_status AS ENUM ('pending_payout', 'paid');

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_phone TEXT;

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS payout_phone TEXT,
  ADD COLUMN IF NOT EXISTS payout_status public.payout_status NOT NULL DEFAULT 'pending_payout',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link_path TEXT;

-- Notifications with optional deep link
CREATE OR REPLACE FUNCTION app.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_link_path TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link_path)
  VALUES (p_user_id, p_title, p_body, p_link_path)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update goal (title/description always; target only when empty)
CREATE OR REPLACE FUNCTION app.update_goal(
  p_user_id UUID,
  p_goal_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_target_amount NUMERIC DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_goal public.savings_goals%ROWTYPE;
BEGIN
  SELECT * INTO v_goal FROM public.savings_goals
  WHERE id = p_goal_id AND user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  IF v_goal.status NOT IN ('active', 'matured') THEN
    RAISE EXCEPTION 'This goal cannot be edited';
  END IF;

  IF p_target_amount IS NOT NULL AND v_goal.current_amount > 0 THEN
    RAISE EXCEPTION 'Target amount cannot be changed after deposits have been made';
  END IF;

  IF p_target_amount IS NOT NULL AND p_target_amount <= 0 THEN
    RAISE EXCEPTION 'Target amount must be positive';
  END IF;

  UPDATE public.savings_goals
  SET
    title = COALESCE(NULLIF(TRIM(p_title), ''), title),
    description = p_description,
    target_amount = COALESCE(p_target_amount, target_amount)
  WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cancel goal (only when empty and active)
CREATE OR REPLACE FUNCTION app.cancel_goal(p_user_id UUID, p_goal_id UUID)
RETURNS VOID AS $$
DECLARE
  v_goal public.savings_goals%ROWTYPE;
BEGIN
  SELECT * INTO v_goal FROM public.savings_goals
  WHERE id = p_goal_id AND user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  IF v_goal.status <> 'active' THEN
    RAISE EXCEPTION 'Only active goals can be cancelled';
  END IF;

  IF v_goal.current_amount > 0 THEN
    RAISE EXCEPTION 'Goals with a balance cannot be cancelled. Withdraw funds first.';
  END IF;

  UPDATE public.savings_goals SET status = 'cancelled' WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Mark withdrawal payout as paid (admin)
CREATE OR REPLACE FUNCTION app.mark_withdrawal_paid(p_withdrawal_id UUID, p_admin_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.withdrawals
  SET payout_status = 'paid', paid_at = NOW()
  WHERE id = p_withdrawal_id AND payout_status = 'pending_payout';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found or already paid';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Withdraw with payout phone + account status checks
CREATE OR REPLACE FUNCTION app.withdraw_funds(
  p_user_id UUID,
  p_goal_id UUID,
  p_amount NUMERIC
)
RETURNS UUID AS $$
DECLARE
  v_goal public.savings_goals%ROWTYPE;
  v_account public.savings_accounts%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_penalty RECORD;
  v_withdrawal_id UUID;
  v_is_early BOOLEAN;
  v_payout_phone TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be positive';
  END IF;

  SELECT * INTO v_account FROM public.savings_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  IF v_account.status = 'pending' THEN
    RAISE EXCEPTION 'Your account is not active. Please deposit 1,000 FCFA to activate your account.';
  END IF;

  IF v_account.status = 'suspended' THEN
    RAISE EXCEPTION 'Your account is suspended. Contact support for assistance.';
  END IF;

  IF v_account.status = 'closed' THEN
    RAISE EXCEPTION 'Your account is closed.';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  v_payout_phone := COALESCE(NULLIF(TRIM(v_profile.payout_phone), ''), NULLIF(TRIM(v_profile.phone), ''));

  IF v_payout_phone IS NULL THEN
    RAISE EXCEPTION 'Please set a payout phone number in your profile before withdrawing.';
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
    RAISE EXCEPTION 'Your account must maintain the required 1,000 FCFA reserve balance.';
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

  INSERT INTO public.withdrawals (
    user_id, goal_id, amount, penalty_amount, net_amount, is_early, payout_phone, payout_status
  )
  VALUES (
    p_user_id, p_goal_id, p_amount, v_penalty.penalty_amount, v_penalty.net_amount,
    v_is_early, v_payout_phone, 'pending_payout'
  )
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
      'A penalty of ' || v_penalty.penalty_amount || ' FCFA was applied to your early withdrawal.',
      '/history/withdrawals'
    );
    PERFORM app.adjust_discipline(p_user_id, -50, 'early_withdrawal');
  END IF;

  PERFORM app.create_notification(
    p_user_id, 'Withdrawal Submitted',
    v_penalty.net_amount || ' FCFA will be sent to ' || v_payout_phone || '. Payout is being processed.',
    '/history/withdrawals'
  );

  RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Deposit funds: add notification links
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
  WHERE id = p_goal_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  SELECT * INTO v_account FROM public.savings_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  v_was_pending := v_account.status = 'pending';

  IF v_was_pending AND (v_account.balance + p_amount) < v_account.reserve_balance THEN
    RAISE EXCEPTION 'A minimum deposit of 1,000 FCFA is required to activate your account.';
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
      'Your account is now active. Your 1,000 FCFA reserve balance is secured and your savings can begin.',
      '/dashboard'
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
    'Your deposit of ' || p_amount || ' FCFA to ' || v_goal.title || ' has been confirmed.',
    '/goals/' || p_goal_id
  );

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Maturity notifications with links
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
      'Your savings goal "' || v_goal.title || '" has reached maturity. You can now withdraw without penalties.',
      '/goals/' || v_goal.id
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Complete goal with link
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
    'Congratulations! You completed your savings goal "' || v_goal.title || '".',
    '/goals/' || p_goal_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Public wrappers
CREATE OR REPLACE FUNCTION public.update_goal(
  p_goal_id UUID, p_title TEXT, p_description TEXT, p_target_amount NUMERIC DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  PERFORM app.update_goal(auth.uid(), p_goal_id, p_title, p_description, p_target_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cancel_goal(p_goal_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM app.cancel_goal(auth.uid(), p_goal_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.mark_withdrawal_paid(p_withdrawal_id UUID)
RETURNS VOID AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM app.mark_withdrawal_paid(p_withdrawal_id, auth.uid());

  SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = p_withdrawal_id;
  IF FOUND THEN
    PERFORM app.create_notification(
      v_withdrawal.user_id,
      'Payout Sent',
      'Your withdrawal of ' || v_withdrawal.net_amount || ' FCFA has been sent to ' || v_withdrawal.payout_phone || '.',
      '/history/withdrawals'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.update_goal TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_goal TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_withdrawal_paid TO authenticated;

CREATE INDEX IF NOT EXISTS idx_withdrawals_payout_status ON public.withdrawals(payout_status)
  WHERE payout_status = 'pending_payout';
