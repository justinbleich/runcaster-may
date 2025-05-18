-- First, enable RLS on challenges table if not already enabled
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow inserts from the create_new_challenge function
CREATE POLICY challenges_insert_policy ON challenges 
FOR INSERT 
WITH CHECK (true);

-- Create a policy to allow all users to view active challenges
CREATE POLICY challenges_select_policy ON challenges 
FOR SELECT 
USING (true);

-- Create a policy to allow updates to challenges
CREATE POLICY challenges_update_policy ON challenges 
FOR UPDATE 
USING (true);

-- Enable RLS on challenge_config table
ALTER TABLE challenge_config ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow inserts to challenge_config
CREATE POLICY challenge_config_insert_policy ON challenge_config 
FOR INSERT 
WITH CHECK (true);

-- Create a policy to allow all users to view challenge_config
CREATE POLICY challenge_config_select_policy ON challenge_config 
FOR SELECT 
USING (true);

-- Create a policy to allow updates to challenge_config
CREATE POLICY challenge_config_update_policy ON challenge_config 
FOR UPDATE 
USING (true);

-- Enable RLS on challenge_rankings table
ALTER TABLE challenge_rankings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow inserts to challenge_rankings
CREATE POLICY challenge_rankings_insert_policy ON challenge_rankings 
FOR INSERT 
WITH CHECK (true);

-- Create a policy to allow all users to view challenge_rankings
CREATE POLICY challenge_rankings_select_policy ON challenge_rankings 
FOR SELECT 
USING (true);

-- Create a policy to allow updates to challenge_rankings
CREATE POLICY challenge_rankings_update_policy ON challenge_rankings 
FOR UPDATE 
USING (true);

-- Grant necessary permissions to anon and authenticated roles for all tables
GRANT SELECT, INSERT, UPDATE ON challenges TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON challenge_config TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON challenge_rankings TO anon, authenticated; 