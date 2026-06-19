-- Admin console: account management, adjustments, enhanced metrics, payout references

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS payout_reference TEXT;

-- Enhanced admin metrics
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
      'pending_deposits', (SELECT COUNT(*) FROM public.deposit_requests WHERE status = 'pending'),
      'pending_payouts', (SELECT COUNT(*) FROM public.withdrawals WHERE payout_status = 'pending_payout'),
      'new_users_week', (
        SELECT COUNT(*) FROM public.profiles
        WHERE role = 'saver' AND created_at >= NOW() - INTERVAL '7 days'
      ),
      'new_users_month', (
        SELECT COUNT(*) FROM public.profiles
        WHERE role = 'saver' AND created_at >= DATE_TRUNC('month', NOW())
      ),
      'deposits_this_week', (
        SELECT COALESCE(SUM(amount), 0) FROM public.transactions
        WHERE transaction_type = 'deposit' AND created_at >= NOW() - INTERVAL '7 days'
      ),
      'withdrawals_this_week', (
        SELECT COALESCE(SUM(amount), 0) FROM public.transactions
        WHERE transaction_type = 'withdrawal' AND created_at >= NOW() - INTERVAL '7 days'
      ),
      'oldest_pending_deposit_hours', (
        SELECT COALESCE(
          EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 3600,
          0
        )::INTEGER
        FROM public.deposit_requests WHERE status = 'pending'
      ),
      'suspended_accounts', (
        SELECT COUNT(*) FROM public.savings_accounts WHERE status = 'suspended'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Mark withdrawal paid with optional payout reference
CREATE OR REPLACE FUNCTION app.mark_withdrawal_paid(
  p_withdrawal_id UUID,
  p_admin_id UUID,
  p_payout_reference TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.withdrawals
  SET
    payout_status = 'paid',
    paid_at = NOW(),
    payout_reference = NULLIF(TRIM(p_payout_reference), '')
  WHERE id = p_withdrawal_id AND payout_status = 'pending_payout';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found or already paid';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.mark_withdrawal_paid(
  p_withdrawal_id UUID,
  p_payout_reference TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM app.mark_withdrawal_paid(p_withdrawal_id, auth.uid(), p_payout_reference);

  SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = p_withdrawal_id;
  IF FOUND THEN
    PERFORM app.create_notification(
      v_withdrawal.user_id,
      'Payout Sent',
      'Your withdrawal of ' || v_withdrawal.net_amount || ' FCFA has been sent to ' || COALESCE(v_withdrawal.payout_phone, 'your phone') || '.',
      '/history/withdrawals'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Admin: update account status (suspend / reactivate / close)
CREATE OR REPLACE FUNCTION app.admin_update_account_status(
  p_admin_id UUID,
  p_user_id UUID,
  p_status public.account_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_account public.savings_accounts%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_status NOT IN ('active', 'suspended', 'closed', 'pending') THEN
    RAISE EXCEPTION 'Invalid account status';
  END IF;

  SELECT * INTO v_account FROM public.savings_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF p_status = 'closed' AND v_account.balance > v_account.reserve_balance THEN
    RAISE EXCEPTION 'Cannot close account with withdrawable balance. User must withdraw funds first.';
  END IF;

  UPDATE public.savings_accounts SET status = p_status WHERE user_id = p_user_id;

  PERFORM app.create_notification(
    p_user_id,
    CASE p_status
      WHEN 'suspended' THEN 'Account Suspended'
      WHEN 'active' THEN 'Account Reactivated'
      WHEN 'closed' THEN 'Account Closed'
      ELSE 'Account Status Updated'
    END,
    COALESCE(NULLIF(TRIM(p_reason), ''), 'Your account status has been updated to ' || p_status || '.'),
    '/profile'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.admin_update_account_status(
  p_user_id UUID,
  p_status public.account_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  PERFORM app.admin_update_account_status(auth.uid(), p_user_id, p_status, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Admin: manual balance adjustment or refund
CREATE OR REPLACE FUNCTION app.admin_adjust_balance(
  p_admin_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_type public.transaction_type,
  p_reason TEXT,
  p_goal_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_account public.savings_accounts%ROWTYPE;
  v_goal public.savings_goals%ROWTYPE;
  v_tx_id UUID;
  v_delta NUMERIC;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_type NOT IN ('adjustment', 'refund') THEN
    RAISE EXCEPTION 'Invalid transaction type for manual adjustment';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  IF NULLIF(TRIM(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'A reason is required';
  END IF;

  v_delta := CASE WHEN p_type = 'refund' THEN p_amount ELSE p_amount END;

  SELECT * INTO v_account FROM public.savings_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF p_goal_id IS NOT NULL THEN
    SELECT * INTO v_goal FROM public.savings_goals
    WHERE id = p_goal_id AND user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Goal not found';
    END IF;
  END IF;

  -- For negative adjustments (passed as type adjustment with sign handled via p_amount always positive for refund, 
  -- adjustment can credit or debit via separate param)
  -- Simplified: refund = credit, adjustment with positive = credit; use admin_adjust_balance_debit for debits
  UPDATE public.savings_accounts
  SET balance = balance + v_delta
  WHERE user_id = p_user_id;

  IF p_goal_id IS NOT NULL THEN
    UPDATE public.savings_goals
    SET current_amount = current_amount + v_delta
    WHERE id = p_goal_id;
  END IF;

  INSERT INTO public.transactions (user_id, goal_id, amount, transaction_type, description)
  VALUES (p_user_id, p_goal_id, v_delta, p_type, 'Admin: ' || p_reason)
  RETURNING id INTO v_tx_id;

  PERFORM app.create_notification(
    p_user_id,
    CASE p_type WHEN 'refund' THEN 'Refund Processed' ELSE 'Balance Adjustment' END,
    p_reason || ' (' || v_delta || ' FCFA)',
    '/history/transactions'
  );

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION app.admin_debit_balance(
  p_admin_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_reason TEXT,
  p_goal_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_account public.savings_accounts%ROWTYPE;
  v_goal public.savings_goals%ROWTYPE;
  v_tx_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  IF NULLIF(TRIM(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'A reason is required';
  END IF;

  SELECT * INTO v_account FROM public.savings_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF v_account.balance - p_amount < v_account.reserve_balance THEN
    RAISE EXCEPTION 'Debit would violate reserve balance requirement';
  END IF;

  IF p_goal_id IS NOT NULL THEN
    SELECT * INTO v_goal FROM public.savings_goals
    WHERE id = p_goal_id AND user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Goal not found';
    END IF;
    IF v_goal.current_amount < p_amount THEN
      RAISE EXCEPTION 'Insufficient goal balance';
    END IF;
    UPDATE public.savings_goals
    SET current_amount = current_amount - p_amount
    WHERE id = p_goal_id;
  END IF;

  UPDATE public.savings_accounts
  SET balance = balance - p_amount
  WHERE user_id = p_user_id;

  INSERT INTO public.transactions (user_id, goal_id, amount, transaction_type, description)
  VALUES (p_user_id, p_goal_id, p_amount, 'adjustment', 'Admin debit: ' || p_reason)
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.admin_credit_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type public.transaction_type,
  p_reason TEXT,
  p_goal_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN app.admin_adjust_balance(auth.uid(), p_user_id, p_amount, p_type, p_reason, p_goal_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.admin_debit_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reason TEXT,
  p_goal_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN app.admin_debit_balance(auth.uid(), p_user_id, p_amount, p_reason, p_goal_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Admin: update user role
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_user_id UUID,
  p_role public.user_role
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  IF p_role NOT IN ('saver', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Admin: verify phone
CREATE OR REPLACE FUNCTION public.admin_verify_phone(
  p_user_id UUID,
  p_verified BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles SET phone_verified = p_verified WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Admin: user detail summary
CREATE OR REPLACE FUNCTION public.get_admin_user_detail(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT json_build_object(
      'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = p_user_id),
      'account', (SELECT row_to_json(a) FROM public.savings_accounts a WHERE a.user_id = p_user_id),
      'discipline', (SELECT row_to_json(d) FROM public.discipline_scores d WHERE d.user_id = p_user_id),
      'goals_count', (SELECT COUNT(*) FROM public.savings_goals WHERE user_id = p_user_id),
      'active_goals', (SELECT COUNT(*) FROM public.savings_goals WHERE user_id = p_user_id AND status = 'active'),
      'total_deposited', (
        SELECT COALESCE(SUM(amount), 0) FROM public.transactions
        WHERE user_id = p_user_id AND transaction_type = 'deposit'
      ),
      'pending_deposits', (
        SELECT COUNT(*) FROM public.deposit_requests
        WHERE user_id = p_user_id AND status = 'pending'
      ),
      'pending_payouts', (
        SELECT COUNT(*) FROM public.withdrawals
        WHERE user_id = p_user_id AND payout_status = 'pending_payout'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_update_account_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_credit_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_debit_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_phone TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_detail TO authenticated;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Audit helper for admin RPCs
CREATE OR REPLACE FUNCTION app.log_audit(
  p_actor_id UUID,
  p_action TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, metadata)
  VALUES (p_actor_id, p_action, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-wrap admin_update_account_status with audit
CREATE OR REPLACE FUNCTION public.admin_update_account_status(
  p_user_id UUID,
  p_status public.account_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  PERFORM app.admin_update_account_status(auth.uid(), p_user_id, p_status, p_reason);
  PERFORM app.log_audit(auth.uid(), 'update_account_status', jsonb_build_object(
    'user_id', p_user_id, 'status', p_status, 'reason', p_reason
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.admin_credit_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type public.transaction_type,
  p_reason TEXT,
  p_goal_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE v_tx_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_tx_id := app.admin_adjust_balance(auth.uid(), p_user_id, p_amount, p_type, p_reason, p_goal_id);
  PERFORM app.log_audit(auth.uid(), 'credit_balance', jsonb_build_object(
    'user_id', p_user_id, 'amount', p_amount, 'type', p_type, 'reason', p_reason
  ));
  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.admin_debit_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reason TEXT,
  p_goal_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE v_tx_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_tx_id := app.admin_debit_balance(auth.uid(), p_user_id, p_amount, p_reason, p_goal_id);
  PERFORM app.log_audit(auth.uid(), 'debit_balance', jsonb_build_object(
    'user_id', p_user_id, 'amount', p_amount, 'reason', p_reason
  ));
  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_user_id UUID,
  p_role public.user_role
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  IF p_role NOT IN ('saver', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  PERFORM app.log_audit(auth.uid(), 'update_user_role', jsonb_build_object(
    'user_id', p_user_id, 'role', p_role
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.mark_withdrawal_paid(
  p_withdrawal_id UUID,
  p_payout_reference TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM app.mark_withdrawal_paid(p_withdrawal_id, auth.uid(), p_payout_reference);

  SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = p_withdrawal_id;
  IF FOUND THEN
    PERFORM app.log_audit(auth.uid(), 'mark_withdrawal_paid', jsonb_build_object(
      'withdrawal_id', p_withdrawal_id,
      'amount', v_withdrawal.net_amount,
      'payout_reference', p_payout_reference
    ));
    PERFORM app.create_notification(
      v_withdrawal.user_id,
      'Payout Sent',
      'Your withdrawal of ' || v_withdrawal.net_amount || ' FCFA has been sent to ' || COALESCE(v_withdrawal.payout_phone, 'your phone') || '.',
      '/history/withdrawals'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
