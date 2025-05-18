-- Create stored procedure to calculate user distances for a challenge
CREATE OR REPLACE FUNCTION calculate_user_distances(challenge_id uuid)
RETURNS TABLE (
  fid integer,
  user_address text,
  total_distance float,
  activity_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.fid,
    a.user_address,
    SUM(a.distance) as total_distance,
    COUNT(a.id) as activity_count
  FROM 
    activities a
    JOIN challenges c ON a.created_at BETWEEN c.start_date AND c.end_date
  WHERE 
    c.id = challenge_id
    AND a.type = (SELECT activity_type FROM challenges WHERE id = challenge_id)
  GROUP BY 
    a.fid, a.user_address;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure to calculate rankings for a challenge
CREATE OR REPLACE FUNCTION calculate_challenge_rankings(challenge_id uuid)
RETURNS void AS $$
DECLARE
  v_challenge record;
  v_first_place_pct float;
  v_second_place_pct float;
  v_third_place_pct float;
  v_remaining_pct float;
  v_pool_amount float;
  v_user record;
  v_rank integer := 1;
  v_pct float;
  v_amount float;
BEGIN
  -- Get challenge details and configuration
  SELECT c.*, 
    COALESCE(cc.pool_amount, 1000) as pool_amount,
    COALESCE(cc.first_place_pct, 0.5) as first_place_pct,
    COALESCE(cc.second_place_pct, 0.3) as second_place_pct,
    COALESCE(cc.third_place_pct, 0.15) as third_place_pct,
    COALESCE(cc.remaining_pct, 0.05) as remaining_pct
  INTO v_challenge
  FROM challenges c
  LEFT JOIN challenge_config cc ON cc.challenge_type = 
    CASE 
      WHEN c.activity_type = 'run' AND c.target_unit = 'km' AND EXTRACT(DAY FROM (c.end_date - c.start_date)) <= 7 
      THEN 'weekly_distance' 
      ELSE 'custom' 
    END
  WHERE c.id = challenge_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge with ID % not found', challenge_id;
  END IF;
  
  v_first_place_pct := v_challenge.first_place_pct;
  v_second_place_pct := v_challenge.second_place_pct;
  v_third_place_pct := v_challenge.third_place_pct;
  v_remaining_pct := v_challenge.remaining_pct;
  v_pool_amount := v_challenge.pool_amount;
  
  -- Create a temporary table with the total distances and rankings
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_rankings AS
  SELECT 
    fid,
    user_address,
    total_distance,
    activity_count,
    RANK() OVER (ORDER BY total_distance DESC) as rank
  FROM calculate_user_distances(challenge_id);
  
  -- Delete existing rankings for this challenge
  DELETE FROM challenge_rankings WHERE challenge_id = v_challenge.id;
  
  -- Insert new rankings
  FOR v_user IN SELECT * FROM temp_rankings ORDER BY rank LOOP
    -- Calculate percentage based on rank
    CASE 
      WHEN v_user.rank = 1 THEN v_pct := v_first_place_pct;
      WHEN v_user.rank = 2 THEN v_pct := v_second_place_pct;
      WHEN v_user.rank = 3 THEN v_pct := v_third_place_pct;
      WHEN v_user.rank BETWEEN 4 AND 10 THEN v_pct := v_remaining_pct / 7;
      ELSE v_pct := 0;
    END CASE;
    
    -- Calculate reward amount
    v_amount := v_pool_amount * v_pct;
    
    -- Insert ranking
    INSERT INTO challenge_rankings (
      challenge_id,
      fid,
      user_address,
      rank,
      achievement_value,
      reward_percentage,
      reward_amount
    ) VALUES (
      v_challenge.id,
      v_user.fid,
      v_user.user_address,
      v_user.rank,
      v_user.total_distance,
      v_pct,
      v_amount
    );
  END LOOP;
  
  -- Clean up
  DROP TABLE IF EXISTS temp_rankings;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure with fixed parameter name
CREATE OR REPLACE FUNCTION create_new_challenge(input_challenge_type text)
RETURNS uuid AS $$
DECLARE
  v_config record;
  v_start_date timestamp;
  v_end_date timestamp;
  v_challenge_id uuid;
BEGIN
  -- Get configuration for this challenge type
  SELECT * INTO v_config FROM challenge_config WHERE challenge_type = input_challenge_type;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge configuration for type % not found', input_challenge_type;
  END IF;
  
  -- Calculate start and end dates
  v_start_date := CURRENT_TIMESTAMP;
  v_end_date := v_start_date + (v_config.duration_days || ' days')::interval;
  
  -- Create new challenge
  INSERT INTO challenges (
    title,
    description,
    activity_type,
    target_value,
    target_unit,
    start_date,
    end_date,
    entry_fee,
    is_active,
    reward_type
  ) VALUES (
    v_config.title,
    v_config.description,
    v_config.activity_type,
    v_config.target_value,
    v_config.target_unit,
    v_start_date,
    v_end_date,
    v_config.entry_fee,
    true,
    v_config.reward_type
  ) RETURNING id INTO v_challenge_id;
  
  RETURN v_challenge_id;
END;
$$ LANGUAGE plpgsql;

-- Create main procedure to manage weekly challenges
CREATE OR REPLACE FUNCTION manage_weekly_challenges()
RETURNS json AS $$
DECLARE
  v_completed_challenges uuid[];
  v_new_challenge_id uuid;
  v_result json;
  v_challenge_id uuid;
BEGIN
  -- Find and close active challenges that have ended
  WITH ended_challenges AS (
    UPDATE challenges 
    SET is_active = false
    WHERE is_active = true 
    AND end_date < CURRENT_TIMESTAMP
    RETURNING id
  )
  SELECT array_agg(id) INTO v_completed_challenges FROM ended_challenges;
  
  -- Calculate rankings for ended challenges
  IF v_completed_challenges IS NOT NULL THEN
    FOREACH v_challenge_id IN ARRAY v_completed_challenges LOOP
      PERFORM calculate_challenge_rankings(v_challenge_id);
    END LOOP;
  END IF;
  
  -- Create new weekly challenge
  v_new_challenge_id := create_new_challenge('weekly_distance');
  
  -- Prepare result
  SELECT json_build_object(
    'completed_challenges', v_completed_challenges,
    'new_challenge_id', v_new_challenge_id,
    'timestamp', CURRENT_TIMESTAMP
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql; 