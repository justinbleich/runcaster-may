-- Create configuration table for challenges
CREATE TABLE IF NOT EXISTS challenge_config (
  id serial PRIMARY KEY,
  challenge_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  activity_type text,
  target_value float,
  target_unit text,
  duration_days integer NOT NULL,
  entry_fee float DEFAULT 0,
  reward_type text NOT NULL,
  pool_amount float DEFAULT 1000,
  first_place_pct float DEFAULT 0.5,
  second_place_pct float DEFAULT 0.3,
  third_place_pct float DEFAULT 0.15,
  remaining_pct float DEFAULT 0.05,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create challenge_rankings table if it doesn't exist
CREATE TABLE IF NOT EXISTS challenge_rankings (
  id serial PRIMARY KEY,
  challenge_id uuid REFERENCES challenges(id),
  fid integer,
  user_address text,
  rank integer,
  achievement_value float,
  reward_percentage float,
  reward_amount float,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration for weekly distance challenge
INSERT INTO challenge_config 
  (challenge_type, title, description, activity_type, target_value, target_unit, duration_days, reward_type)
VALUES
  (
    'weekly_distance',
    'Weekly Distance Challenge',
    'Run as much as you can over the course of the week! Top performers by total distance will be rewarded: 1st place: 50% of pool, 2nd place: 30%, 3rd place: 15%, 4th-10th place: share 5%',
    'run',
    0,
    'km',
    7,
    'ranked_percentage'
  )
ON CONFLICT DO NOTHING; 