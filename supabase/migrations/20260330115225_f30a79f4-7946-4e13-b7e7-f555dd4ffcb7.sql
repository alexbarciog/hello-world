UPDATE public.scheduled_messages
SET message = $$I noticed your recent post about boosting sales. Since you focus on booking qualified meetings for B2B founders, I’m curious if the startups you work with ever struggle to scale their tech teams as fast as their sales grow.

Open to a quick chat?$$,
    generated_at = now()
WHERE id = 'b7a33af2-edc4-438c-853b-b9b2bdedfd51';

UPDATE public.scheduled_messages
SET message = $$I saw your post about boosting sales and liked your point on multi-channel outreach. It makes sense for improving conversion rates.

As you scale, are you running into any technical bottlenecks with your platform or engineering team?$$,
    generated_at = now()
WHERE id = '22f1712f-ed5e-45e5-80da-ed49c80cb05f';

UPDATE public.scheduled_messages
SET message = $$I noticed your recent post about boosting sales and liked your view on lead generation.

As you grow, are you hitting any technical bottlenecks while scaling your outreach tools or platform?$$,
    generated_at = now()
WHERE id = 'c6710453-897f-408a-9708-dd8cb27d173c';