-- Create multiple challenges
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
VALUES 
-- Running challenge
(
  gen_random_uuid(),
  'Weekly Run Challenge', 
  'Run at least 20km this week to complete the challenge and get rewards!',
  'run', 
  20, 
  'km', 
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  0,
  true,
  CURRENT_TIMESTAMP
),
-- Cycling challenge
(
  gen_random_uuid(),
  'Cyclist Tour', 
  'Ride your bike for at least 50km to complete this challenge!',
  'bike', 
  50, 
  'km', 
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  0,
  true,
  CURRENT_TIMESTAMP
),
-- Walking challenge
(
  gen_random_uuid(),
  'Step Challenge', 
  'Walk for a total of 30km by the end of the week.',
  'walk', 
  30, 
  'km', 
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  0,
  true,
  CURRENT_TIMESTAMP
),
-- Activity count challenge (any activity type)
(
  gen_random_uuid(),
  'Activity Streak', 
  'Complete at least 5 activities of any type this week.',
  null, -- Any activity type
  5, 
  'count', 
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  0,
  true,
  CURRENT_TIMESTAMP
)
RETURNING *; 