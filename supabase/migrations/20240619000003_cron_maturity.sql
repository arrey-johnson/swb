-- pg_cron maturity check (runs daily at midnight UTC)
-- Note: pg_cron must be enabled in Supabase dashboard (Database > Extensions)
SELECT cron.schedule(
  'check-goal-maturity',
  '0 0 * * *',
  $$SELECT app.check_maturity()$$
);
