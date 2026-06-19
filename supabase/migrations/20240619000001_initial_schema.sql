-- SaveWithBanks Initial Schema
-- Enums
CREATE TYPE public.user_role AS ENUM ('saver', 'admin');
CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'closed');
CREATE TYPE public.goal_status AS ENUM ('active', 'matured', 'completed', 'withdrawn_early');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'penalty', 'adjustment', 'refund');
CREATE TYPE public.deposit_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.discipline_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- Private app schema for SECURITY DEFINER functions
CREATE SCHEMA IF NOT EXISTS app;
REVOKE ALL ON SCHEMA app FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO service_role;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'saver',
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Savings accounts
CREATE TABLE public.savings_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 5000.00,
  reserve_balance NUMERIC(15, 2) NOT NULL DEFAULT 5000.00,
  status public.account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reserve_balance_fixed CHECK (reserve_balance = 5000),
  CONSTRAINT balance_meets_reserve CHECK (balance >= reserve_balance)
);

-- Savings goals
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  duration_months INTEGER NOT NULL CHECK (duration_months IN (3, 6, 12)),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  maturity_date DATE NOT NULL,
  status public.goal_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions (immutable ledger)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.savings_goals(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL,
  transaction_type public.transaction_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Withdrawals
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  penalty_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (penalty_amount >= 0),
  net_amount NUMERIC(15, 2) NOT NULL CHECK (net_amount > 0),
  is_early BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deposit requests (manual proof flow)
CREATE TABLE public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  proof_url TEXT,
  status public.deposit_request_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penalty settings
CREATE TABLE public.penalty_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_months INTEGER NOT NULL UNIQUE CHECK (duration_months IN (3, 6, 12)),
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform settings
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discipline scores
CREATE TABLE public.discipline_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  level public.discipline_level NOT NULL DEFAULT 'bronze',
  last_deposit_month DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX idx_savings_goals_status ON public.savings_goals(status);
CREATE INDEX idx_savings_goals_maturity ON public.savings_goals(maturity_date) WHERE status = 'active';
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_deposit_requests_status ON public.deposit_requests(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;

-- Seed penalty settings
INSERT INTO public.penalty_settings (duration_months, percentage) VALUES
  (3, 5.00),
  (6, 7.00),
  (12, 10.00);

-- Seed platform deposit instructions
INSERT INTO public.platform_settings (key, value) VALUES
  ('deposit_instructions', '{"phone": "654112103", "name": "Melvis-Dalitine"}');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER savings_accounts_updated_at BEFORE UPDATE ON public.savings_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER savings_goals_updated_at BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- New user provisioning
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
  INSERT INTO public.savings_accounts (user_id, balance, reserve_balance)
  VALUES (NEW.id, 5000.00, 5000.00);
  INSERT INTO public.discipline_scores (user_id, points, level)
  VALUES (NEW.id, 0, 'bronze');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Discipline level helper
CREATE OR REPLACE FUNCTION app.calculate_discipline_level(p_points INTEGER)
RETURNS public.discipline_level AS $$
BEGIN
  IF p_points >= 500 THEN RETURN 'platinum';
  ELSIF p_points >= 300 THEN RETURN 'gold';
  ELSIF p_points >= 100 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Immutability on transactions
REVOKE UPDATE, DELETE ON public.transactions FROM authenticated;
REVOKE UPDATE, DELETE ON public.transactions FROM anon;
