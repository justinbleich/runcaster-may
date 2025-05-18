-- Script to calculate rankings for the total distance challenge
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
    -- First, sum the total distance for each participant during the challenge period
    WITH total_distances AS (
        SELECT 
            a.fid,
            a.user_address,
            -- Sum all run distances for each user during the challenge period
            SUM(a.distance) as total_distance
        FROM 
            activities a
            JOIN challenges c ON a.created_at BETWEEN c.start_date AND c.end_date
        WHERE 
            c.id = v_challenge_id
            AND a.type = 'run'
        GROUP BY 
            a.fid, a.user_address
    ),
    -- Rank the participants by their total distance
    ranked_participants AS (
        SELECT 
            fid,
            user_address,
            total_distance,
            RANK() OVER (ORDER BY total_distance DESC) as rank
        FROM 
            total_distances
    )
    
    -- Insert or update the challenge_rankings table
    MERGE INTO challenge_rankings cr
    USING ranked_participants rp ON (cr.challenge_id = v_challenge_id AND cr.fid = rp.fid)
    WHEN MATCHED THEN
        UPDATE SET 
            rank = rp.rank,
            achievement_value = rp.total_distance,
            reward_percentage = 
                CASE
                    WHEN rp.rank = 1 THEN v_first_place_pct
                    WHEN rp.rank = 2 THEN v_second_place_pct
                    WHEN rp.rank = 3 THEN v_third_place_pct
                    WHEN rp.rank BETWEEN 4 AND 10 THEN v_remaining_pct / 7 -- Split remaining 5% among 7 people
                    ELSE 0
                END,
            reward_amount = 
                CASE
                    WHEN rp.rank = 1 THEN v_pool_amount * v_first_place_pct
                    WHEN rp.rank = 2 THEN v_pool_amount * v_second_place_pct
                    WHEN rp.rank = 3 THEN v_pool_amount * v_third_place_pct
                    WHEN rp.rank BETWEEN 4 AND 10 THEN v_pool_amount * (v_remaining_pct / 7)
                    ELSE 0
                END,
            updated_at = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (challenge_id, fid, user_address, rank, achievement_value, reward_percentage, reward_amount)
        VALUES (
            v_challenge_id,
            rp.fid,
            rp.user_address,
            rp.rank,
            rp.total_distance,
            CASE
                WHEN rp.rank = 1 THEN v_first_place_pct
                WHEN rp.rank = 2 THEN v_second_place_pct
                WHEN rp.rank = 3 THEN v_third_place_pct
                WHEN rp.rank BETWEEN 4 AND 10 THEN v_remaining_pct / 7
                ELSE 0
            END,
            CASE
                WHEN rp.rank = 1 THEN v_pool_amount * v_first_place_pct
                WHEN rp.rank = 2 THEN v_pool_amount * v_second_place_pct
                WHEN rp.rank = 3 THEN v_pool_amount * v_third_place_pct
                WHEN rp.rank BETWEEN 4 AND 10 THEN v_pool_amount * (v_remaining_pct / 7)
                ELSE 0
            END
        );
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