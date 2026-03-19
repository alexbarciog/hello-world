
UPDATE contacts SET relevance_tier = 
  CASE 
    WHEN ai_score >= 2 THEN 'hot'
    WHEN ai_score = 1 THEN 'warm'
    ELSE 'cold'
  END;
