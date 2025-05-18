-- Script to calculate rankings for the total distance challenge (PostgreSQL compatible)
-- Replace 'challenge-id-here' with the actual challenge ID when running

DO $$
DECLARE
    v_challenge_id uuid := 'challenge-id-here'; -- Set this to your actual challenge ID
    v_pool_amount float := 1000; -- Example pool amount (USDC, etc.) to distribute
    v_first_place_pct float := 0.5; -- 50% to first place
    v_second_place_pct float := 0.3; -- 30% to second place
    v_third_place_pct float := 0.15; -- 15% to third place
    v_remaining_pct float := 0.05; -- 5% split among 4th-10th place
BEGIN
    -- Create a temporary table with the total distances
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_total_distances AS
    SELECT 
        a.fid,
        a.user_address,
        SUM(a.distance) as total_distance
    FROM 
        activities a
        JOIN challenges c ON a.created_at BETWEEN c.start_date AND c.end_date
    WHERE 
        c.id = v_challenge_id
        AND a.type = 'run'
    GROUP BY 
        a.fid, a.user_address;
    
    -- Create a temporary table with rankings
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_rankings AS
    SELECT 
        fid,
        user_address,
        total_distance,
        RANK() OVER (ORDER BY total_distance DESC) as rank
    FROM 
        temp_total_distances;
    
    -- Update existing entries
    UPDATE challenge_rankings cr
    SET 
        rank = tr.rank,
        achievement_value = tr.total_distance,
        reward_percentage = 
            CASE
                WHEN tr.rank = 1 THEN v_first_place_pct
                WHEN tr.rank = 2 THEN v_second_place_pct
                WHEN tr.rank = 3 THEN v_third_place_pct
                WHEN tr.rank BETWEEN 4 AND 10 THEN v_remaining_pct / 7
                ELSE 0
            END,
        reward_amount = 
            CASE
                WHEN tr.rank = 1 THEN v_pool_amount * v_first_place_pct
                WHEN tr.rank = 2 THEN v_pool_amount * v_second_place_pct
                WHEN tr.rank = 3 THEN v_pool_amount * v_third_place_pct
                WHEN tr.rank BETWEEN 4 AND 10 THEN v_pool_amount * (v_remaining_pct / 7)
                ELSE 0
            END,
        updated_at = CURRENT_TIMESTAMP
    FROM temp_rankings tr
    WHERE cr.challenge_id = v_challenge_id AND cr.fid = tr.fid;
    
    -- Insert new entries
    INSERT INTO challenge_rankings (
        challenge_id, 
        fid, 
        user_address, 
        rank, 
        achievement_value, 
        reward_percentage, 
        reward_amount
    )
    SELECT 
        v_challenge_id,
        tr.fid,
        tr.user_address,
        tr.rank,
        tr.total_distance,
        CASE
            WHEN tr.rank = 1 THEN v_first_place_pct
            WHEN tr.rank = 2 THEN v_second_place_pct
            WHEN tr.rank = 3 THEN v_third_place_pct
            WHEN tr.rank BETWEEN 4 AND 10 THEN v_remaining_pct / 7
            ELSE 0
        END,
        CASE
            WHEN tr.rank = 1 THEN v_pool_amount * v_first_place_pct
            WHEN tr.rank = 2 THEN v_pool_amount * v_second_place_pct
            WHEN tr.rank = 3 THEN v_pool_amount * v_third_place_pct
            WHEN tr.rank BETWEEN 4 AND 10 THEN v_pool_amount * (v_remaining_pct / 7)
            ELSE 0
        END
    FROM temp_rankings tr
    WHERE NOT EXISTS (
        SELECT 1 FROM challenge_rankings cr 
        WHERE cr.challenge_id = v_challenge_id AND cr.fid = tr.fid
    );
    
    -- Clean up temporary tables
    DROP TABLE IF EXISTS temp_total_distances;
    DROP TABLE IF EXISTS temp_rankings;
END;
$$;

-- View the current rankings
SELECT 
    cr.rank,
    p.username, 
    p.display_name,
    cr.achievement_value as "Total Distance (km)",
    (cr.reward_percentage * 100) as "Reward Percentage",
    cr.reward_amount as "Reward Amount"
FROM 
    challenge_rankings cr
    LEFT JOIN profiles p ON cr.fid = p.fid
WHERE 
    cr.challenge_id = 'challenge-id-here' -- Replace with actual challenge ID
ORDER BY 
    cr.rank; 