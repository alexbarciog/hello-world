DELETE FROM public.ai_chat_messages;
UPDATE public.profiles SET ai_chat_criteria = NULL, ai_chat_lead_status = '{}'::jsonb;