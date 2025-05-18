-- Create the first weekly challenge
INSERT INTO public.challenges (
  id,
  title, 
  description, 
  activity_type, 
  target_value, 
  target_unit, 
  start_date, 
  end_date, 
  entry_fee, 
  is_active,
  created_at
)
VALUES (
  gen_random_uuid(), -- Generate a UUID
  'Weekly Run Challenge', 
  'Run at least 20km this week to complete the challenge and get rewards!',
  'run', 
  20, 
  'km', 
  CURRENT_TIMESTAMP, -- Starts now
  CURRENT_TIMESTAMP + INTERVAL '7 days', -- Ends in 7 days
  0, -- Free entry
  true, -- Active
  CURRENT_TIMESTAMP
)
RETURNING *; 