UPDATE scheduled_messages SET message = 'Congrats on the new role at {{company}}, {{first_name}}. Saw you just started as {{title}} and wanted to reach out.

Are you planning to grow the engineering team at all this year?', generated_at = now() WHERE id = 'b7a33af2-edc4-438c-853b-b9b2bdedfd51';

UPDATE scheduled_messages SET message = 'Congrats on the new role at {{company}}, {{first_name}}. Saw the news on my feed today.

Are you planning to grow your engineering team this quarter?', generated_at = now() WHERE id = '22f1712f-ed5e-45e5-80da-ed49c80cb05f';

UPDATE scheduled_messages SET message = 'Congrats on the new role, {{first_name}}. I saw your update about joining {{company}} as {{title}} and wanted to say hi.

Are you planning to grow your engineering team much this year?', generated_at = now() WHERE id = 'c6710453-897f-408a-9708-dd8cb27d173c';