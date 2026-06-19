-- Add pending account status (must be in its own migration before use)
ALTER TYPE public.account_status ADD VALUE IF NOT EXISTS 'pending';
