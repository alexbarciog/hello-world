ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'personal';

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_account_type_check
CHECK (account_type IN ('personal', 'agency'));