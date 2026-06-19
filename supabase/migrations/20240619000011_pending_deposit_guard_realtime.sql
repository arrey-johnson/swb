-- One pending deposit request per goal at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposit_requests_one_pending_per_goal
  ON public.deposit_requests (goal_id)
  WHERE status = 'pending';

-- Realtime for saver-facing tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
