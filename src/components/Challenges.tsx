import { useState, useMemo, useEffect } from "react";
import { Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getActivities } from "../lib/supabase";
import { sdk } from "@farcaster/frame-sdk";
import { LeaderboardSection } from "./LeaderboardSection";
import { ChallengesSection } from "./ChallengesSection";

// Batch fetch profiles from Neynar
async function fetchProfilesByFids(fids: number[]) {
  if (!fids.length) return {};
  const apiKey = import.meta.env.VITE_NEYNAR_API_KEY;
  const res = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(",")}`, {
    headers: { 'x-api-key': apiKey }
  });
  if (!res.ok) throw new Error('Neynar bulk user fetch failed');
  const data = await res.json();
  const map: Record<number, any> = {};
  (data.users || []).forEach((user: any) => {
    map[user.fid] = user;
  });
  return map;
}

export function Challenges() {
  // Get current user FID
  const [fid, setFid] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).sdk?.context?.user?.fid) {
      setFid((window as any).sdk.context.user.fid);
    }
  }, []);
  
  // Get all activities and unique FIDs
  const { data: activities = [], isLoading } = useQuery({ 
    queryKey: ['all-activities'], 
    queryFn: getActivities 
  });
  
  const uniqueFids = useMemo(() => Array.from(new Set((activities as any[]).map((a: any) => a.fid))), [activities]);
  
  // Batch fetch all profiles
  const { data: profileMap = {} } = useQuery({
    queryKey: ['profile-batch', uniqueFids.join(',')],
    queryFn: () => fetchProfilesByFids(uniqueFids),
    enabled: uniqueFids.length > 0
  }) as { data: Record<number, any> };
  
  return (
    <Stack spacing={8} p={4}>
      {/* Top users leaderboard */}
      <LeaderboardSection 
        isLoading={isLoading} 
        profileMap={profileMap} 
        activities={activities as any[]} 
      />
      
      {/* Weekly Challenges */}
      <ChallengesSection userFid={fid || undefined} />
    </Stack>
  );
} 