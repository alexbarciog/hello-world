-- Epic 3: done-for-you setup. Written only by the setup-orders and stripe-webhook
-- functions. Customers read their order through setup-orders (which leaves out
-- notes_admin), so only admins read the table directly.
CREATE TABLE IF NOT EXISTS public.setup_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'scheduled', 'delivered', 'cancelled')),
  intake jsonb,
  scheduled_at timestamptz,
  delivered_at timestamptz,
  template_id uuid REFERENCES public.agent_templates(id) ON DELETE SET NULL,
  notes_admin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- A webhook replay can't create a second order for one payment.
CREATE UNIQUE INDEX IF NOT EXISTS setup_orders_payment_intent_key
  ON public.setup_orders (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS setup_orders_account_idx ON public.setup_orders (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS setup_orders_status_idx ON public.setup_orders (status, created_at DESC);

ALTER TABLE public.setup_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read setup orders" ON public.setup_orders;
CREATE POLICY "Admins read setup orders" ON public.setup_orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_setup_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS touch_setup_order ON public.setup_orders;
CREATE TRIGGER touch_setup_order BEFORE UPDATE ON public.setup_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_setup_order();
