DELETE FROM contact_lists WHERE contact_id IN (
  '6d0a5db0-510b-43b0-9097-2f2a9d8dad0a',
  '9526484c-2955-47ae-b46d-c20b60e0502c',
  '66c73ee3-f620-42d9-bdd4-e7524f82fb95',
  '894a2874-ea62-4687-9c1d-4756fd137943',
  '204bc37a-14d9-453b-bc31-a0bfe623bf19',
  '65ddf8ac-e14e-4a70-b45e-57838c9f68f8',
  '8855b8ee-813d-4e3d-8628-ab4cfa1ad759',
  'c4ece162-2665-4294-8364-c04b9c5191eb',
  '3975f676-54b3-430e-ac54-bfdb17df13ab',
  '2bd6c0c1-c365-407a-8e6e-ae643587c8d5'
);

DELETE FROM contacts WHERE id IN (
  '6d0a5db0-510b-43b0-9097-2f2a9d8dad0a',
  '9526484c-2955-47ae-b46d-c20b60e0502c',
  '66c73ee3-f620-42d9-bdd4-e7524f82fb95',
  '894a2874-ea62-4687-9c1d-4756fd137943',
  '204bc37a-14d9-453b-bc31-a0bfe623bf19',
  '65ddf8ac-e14e-4a70-b45e-57838c9f68f8',
  '8855b8ee-813d-4e3d-8628-ab4cfa1ad759',
  'c4ece162-2665-4294-8364-c04b9c5191eb',
  '3975f676-54b3-430e-ac54-bfdb17df13ab',
  '2bd6c0c1-c365-407a-8e6e-ae643587c8d5'
);

DELETE FROM contact_lists WHERE contact_id IN (
  SELECT id FROM contacts 
  WHERE user_id = '0c282b0c-48c3-4146-81a9-31a4eb2feb88' 
  AND first_name = 'LinkedIn' AND last_name = 'Member'
);

DELETE FROM contacts 
WHERE user_id = '0c282b0c-48c3-4146-81a9-31a4eb2feb88' 
AND first_name = 'LinkedIn' AND last_name = 'Member'