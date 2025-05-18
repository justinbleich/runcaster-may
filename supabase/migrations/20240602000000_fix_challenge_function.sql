-- Fix the create_new_challenge function to use different parameter names
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