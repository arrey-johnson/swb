-- Public RPC wrappers for Edge Functions (PostgREST exposes public schema only)

CREATE OR REPLACE FUNCTION public.create_goal(
  p_user_id UUID, p_title TEXT, p_description TEXT,
  p_target_amount NUMERIC, p_duration_months INTEGER
) RETURNS UUID AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN app.create_goal(p_user_id, p_title, p_description, p_target_amount, p_duration_months);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.calculate_penalty(p_goal_id UUID, p_amount NUMERIC)
RETURNS JSON AS $$
DECLARE r RECORD;
BEGIN
  SELECT * INTO r FROM app.calculate_penalty(p_goal_id, p_amount);
  RETURN json_build_object(
    'penalty_amount', r.penalty_amount,
    'penalty_percentage', r.penalty_percentage,
    'is_early', r.is_early,
    'net_amount', r.net_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.deposit_funds(
  p_user_id UUID, p_goal_id UUID, p_amount NUMERIC, p_deposit_request_id UUID DEFAULT NULL
) RETURNS UUID AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN app.deposit_funds(p_user_id, p_goal_id, p_amount, p_deposit_request_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.withdraw_funds(p_user_id UUID, p_goal_id UUID, p_amount NUMERIC)
RETURNS UUID AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN app.withdraw_funds(p_user_id, p_goal_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_maturity()
RETURNS INTEGER AS $$
BEGIN
  RETURN app.check_maturity();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.complete_goal(p_goal_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  PERFORM app.complete_goal(p_goal_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.reject_deposit(p_request_id UUID, p_reason TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE public.deposit_requests
  SET status = 'rejected', rejection_reason = p_reason, reviewed_at = NOW(), reviewed_by = auth.uid()
  WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_goal TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_penalty TO authenticated;
GRANT EXECUTE ON FUNCTION public.deposit_funds TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_funds TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_goal TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_deposit TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_maturity TO service_role;
