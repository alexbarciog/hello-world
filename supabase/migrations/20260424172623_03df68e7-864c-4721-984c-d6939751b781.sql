-- Hard guarantee: each user can only ever be sent the discount40 winback once.
CREATE UNIQUE INDEX IF NOT EXISTS discount40_email_log_user_id_unique
  ON public.discount40_email_log (user_id);