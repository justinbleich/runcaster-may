-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  activity_type TEXT, -- Can be 'run', 'bike', 'walk', or NULL for any type
  target_value NUMERIC NOT NULL,
  target_unit TEXT NOT NULL, -- 'km', 'count', or 'locations'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  entry_fee NUMERIC NOT NULL DEFAULT 0, -- USDC amount
  split_address TEXT, -- 0xSplits contract address
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  fid INTEGER NOT NULL, -- Farcaster ID
  user_address TEXT NOT NULL, -- Ethereum address
  current_progress NUMERIC NOT NULL DEFAULT 0,
  has_paid BOOLEAN NOT NULL DEFAULT false,
  transaction_hash TEXT, -- Transaction hash of payment
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on challenge_id and fid for faster lookups
CREATE INDEX IF NOT EXISTS challenge_participants_challenge_id_fid_idx ON challenge_participants(challenge_id, fid);

-- RLS policies
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can read challenges
CREATE POLICY "Anyone can read challenges"
  ON challenges FOR SELECT
  USING (true);

-- Anyone can read challenge participants
CREATE POLICY "Anyone can read challenge participants"
  ON challenge_participants FOR SELECT
  USING (true);

-- Only authenticated users can create challenges
CREATE POLICY "Authenticated users can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can join challenges
CREATE POLICY "Authenticated users can join challenges"
  ON challenge_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can only update their own challenge participation
CREATE POLICY "Users can update their own challenge participation"
  ON challenge_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Challenge creators can update their challenges
CREATE POLICY "Challenge creators can update their challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by); 