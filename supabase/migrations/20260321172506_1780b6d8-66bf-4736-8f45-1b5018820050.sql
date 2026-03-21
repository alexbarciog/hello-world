
-- Remove the dangerous public SELECT policy
DROP POLICY IF EXISTS "Anyone can read reset codes" ON public.password_reset_codes;

-- Remove the public INSERT policy (edge function uses service role)
DROP POLICY IF EXISTS "Anyone can insert reset code" ON public.password_reset_codes;

-- Remove the public UPDATE policy (edge function uses service role)
DROP POLICY IF EXISTS "Anyone can mark code as used" ON public.password_reset_codes;

-- Add service role full access (edge function uses service role for all operations)
CREATE POLICY "Service role full access on password_reset_codes"
ON public.password_reset_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
