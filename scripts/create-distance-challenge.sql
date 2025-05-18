-- Create a distance-based challenge with reward distribution that tracks total distance
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
  created_at,
  reward_type -- New field to indicate reward distribution
)
VALUES (
  gen_random_uuid(),
  'Weekly Distance Challenge', 
  'Run as much as you can over the course of the week! Top performers by total distance will be rewarded: 1st place: 50% of pool, 2nd place: 30%, 3rd place: 15%, 4th-10th place: share 5%',
  'run', 
  0, -- No minimum target, just rank by total distance
  'km', 
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days', -- One week challenge
  0, -- Free entry for now, could add entry fee to create prize pool
  true,
  CURRENT_TIMESTAMP,
  'ranked_percentage' -- Indicating percentage-based reward distribution
)
RETURNING *;

-- Note: You may need to add the reward_type column to your challenges table first if it doesn't exist:
-- ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS reward_type text;

-- Also consider creating a table to track rankings and reward distributions:
CREATE TABLE IF NOT EXISTS challenge_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) NOT NULL,
  fid integer NOT NULL,
  user_address text NOT NULL,
  rank integer NOT NULL,
  achievement_value float NOT NULL, -- The total distance achieved
  reward_percentage float NOT NULL, -- Percentage of pool awarded
  reward_amount float, -- Actual reward amount (may be calculated later)
  paid boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(challenge_id, fid)
); 