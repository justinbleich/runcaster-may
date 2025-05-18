-- View the weekly distance challenge leaderboard in real-time
-- Replace 'challenge-id-here' with the actual challenge ID

WITH current_challenge AS (
    -- Get the active challenge details
    SELECT 
        id,
        title,
        start_date,
        end_date
    FROM 
        challenges
    WHERE 
        id = 'challenge-id-here' -- Replace with your challenge ID
        AND is_active = true
),

user_distances AS (
    -- Calculate total distances for all users during the challenge period
    SELECT 
        a.fid,
        a.user_address,
        SUM(a.distance) as total_distance,
        COUNT(a.id) as activity_count
    FROM 
        activities a
        JOIN current_challenge c ON a.created_at BETWEEN c.start_date AND c.end_date
    WHERE 
        a.type = 'run'
    GROUP BY 
        a.fid, a.user_address
),

ranked_users AS (
    -- Rank the users by their total distance
    SELECT 
        ud.fid,
        ud.user_address,
        ud.total_distance,
        ud.activity_count,
        RANK() OVER (ORDER BY ud.total_distance DESC) as rank,
        CASE
            WHEN RANK() OVER (ORDER BY ud.total_distance DESC) = 1 THEN 50
            WHEN RANK() OVER (ORDER BY ud.total_distance DESC) = 2 THEN 30
            WHEN RANK() OVER (ORDER BY ud.total_distance DESC) = 3 THEN 15
            WHEN RANK() OVER (ORDER BY ud.total_distance DESC) BETWEEN 4 AND 10 THEN 5/7
            ELSE 0
        END as reward_percentage
    FROM 
        user_distances ud
)

-- Show the formatted leaderboard
SELECT 
    ru.rank,
    CASE 
        WHEN ru.rank = 1 THEN '🥇 ' 
        WHEN ru.rank = 2 THEN '🥈 '
        WHEN ru.rank = 3 THEN '🥉 '
        ELSE ''
    END || COALESCE(p.display_name, p.username, 'User ' || ru.fid) as "Runner",
    COALESCE('@' || p.username, '') as "Username",
    ROUND(ru.total_distance::numeric, 2) as "Total Distance (km)",
    ru.activity_count as "Activities",
    ru.reward_percentage || '%' as "Reward",
    CASE
        WHEN CURRENT_TIMESTAMP < cc.start_date THEN 'Not Started'
        WHEN CURRENT_TIMESTAMP > cc.end_date THEN 'Ended'
        ELSE 'Active'
    END as "Status"
FROM 
    ranked_users ru
    LEFT JOIN profiles p ON ru.fid = p.fid
    CROSS JOIN current_challenge cc
ORDER BY 
    ru.rank
LIMIT 20; -- Show top 20 runners 