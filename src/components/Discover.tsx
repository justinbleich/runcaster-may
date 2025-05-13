import { useState, useMemo, useEffect } from "react";
import { Stack, Box, Text, Avatar, HStack } from "@chakra-ui/react";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { getActivities } from "../lib/supabase";
import { sdk } from "@farcaster/frame-sdk";
import { useFarcasterProfile } from "../lib/farcaster";

// Fetch suggested follows from Neynar /user/suggested-follows endpoint
async function fetchSuggestedFollows() {
  const apiKey = import.meta.env.VITE_NEYNAR_API_KEY;
  if (!apiKey) throw new Error('Missing NEYNAR_API_KEY');
  let fid = 1;
  try {
    if (typeof window !== 'undefined' && (window as any).sdk?.context?.user?.fid) {
      fid = (window as any).sdk.context.user.fid;
    }
    const url = `https://api.neynar.com/v2/farcaster/user/suggested-follows?fid=${fid}`;
    const res = await fetch(url, {
      headers: { 'x-api-key': apiKey }
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Neynar suggested follows error:', res.status, text);
      throw new Error(`Neynar error ${res.status}: ${text}`);
    }
    const data = await res.json();
    return (data.result?.users || []).map((user: any) => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.pfp_url,
    }));
  } catch (e) {
    console.error('Neynar suggested follows fetch failed:', e);
    throw e;
  }
}

// Fetch followers from Neynar
async function fetchFollowers(fid: number) {
  const apiKey = import.meta.env.VITE_NEYNAR_API_KEY;
  const res = await fetch(`https://api.neynar.com/v2/farcaster/followers?fid=${fid}&limit=100`, {
    headers: { 'x-api-key': apiKey }
  });
  if (!res.ok) throw new Error('Neynar followers fetch failed');
  const data = await res.json();
  return (data.users || []).map((f: any) => f.user);
}

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

function SuggestedFollowsSection() {
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["suggested-follows"],
    queryFn: fetchSuggestedFollows,
  });
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>Suggested Follows (Neynar)</Text>
      <Stack spacing={3}>
        {isLoading && <Text>Loading...</Text>}
        {error && <Text color="red.500">Error loading suggestions: {String(error)}</Text>}
        {!isLoading && !error && users.map((user: any) => (
          <HStack key={user.fid} spacing={3}>
            <Avatar size="sm" src={user.avatarUrl} name={user.displayName || user.username} />
            <Text fontWeight="medium">@{user.username}</Text>
            <Button size="sm" variant="outline" onClick={() => sdk.actions.viewProfile({ fid: user.fid })}>
              Follow
            </Button>
          </HStack>
        ))}
      </Stack>
    </Box>
  );
}

function ActivityUser({ fid, profileMap }: { fid: number, profileMap: Record<number, any> }) {
  const profile = profileMap[fid];
  return (
    <HStack spacing={2}>
      <Avatar size="sm" src={profile?.pfp_url} name={profile?.display_name || profile?.username || String(fid)} />
      <Text fontWeight="medium">{profile?.display_name || profile?.username || `FID ${fid}`}</Text>
    </HStack>
  );
}

function LocationFacetedActivitiesSection({ profileMap }: { profileMap: Record<number, any> }) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["all-activities"],
    queryFn: getActivities,
  });
  const [selectedLocation, setSelectedLocation] = useState('All');
  // For now, just use 'All' as the only filter since location is not in Activity
  const locations = ['All'];
  const filteredActivities = activities;
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>Filter by Location:</Text>
      <HStack spacing={2} mb={4}>
        {locations.map(loc => (
          <Button key={loc} size="sm" variant={selectedLocation === loc ? 'default' : 'outline'} onClick={() => setSelectedLocation(loc)}>{loc}</Button>
        ))}
      </HStack>
      <Stack spacing={3}>
        {isLoading ? <Text>Loading...</Text> : filteredActivities.map((activity: any) => (
          <Box key={activity.id} p={3} borderWidth={1} borderRadius="md">
            <HStack spacing={3}>
              <ActivityUser fid={activity.fid} profileMap={profileMap} />
              <Text fontWeight="medium">{activity.title || 'Untitled'}</Text>
              <Text color="gray.500">FID: {activity.fid}</Text>
            </HStack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function HiddenGemsSection({ profileMap }: { profileMap: Record<number, any> }) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["all-activities"],
    queryFn: getActivities,
  });
  // Group by fid
  const userMap = new Map();
  activities.forEach((a: any) => {
    if (!userMap.has(a.fid)) {
      userMap.set(a.fid, { fid: a.fid, count: 1 });
    } else {
      userMap.get(a.fid).count++;
    }
  });
  // Sort by least activities, then take first 3
  const hiddenGems = Array.from(userMap.values()).sort((a, b) => a.count - b.count).slice(0, 3);
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>Hidden Gems</Text>
      <Stack spacing={3}>
        {isLoading ? <Text>Loading...</Text> : hiddenGems.map((user: any) => (
          <HStack key={user.fid} spacing={3}>
            <ActivityUser fid={user.fid} profileMap={profileMap} />
            <Button size="sm" variant="outline" onClick={() => sdk.actions.viewProfile({ fid: user.fid })}>
              Follow
            </Button>
          </HStack>
        ))}
      </Stack>
    </Box>
  );
}

function FollowersUsingRuncasterSection({ fid }: { fid: number }) {
  const { data: followersRaw = [], isLoading: followersLoading } = useQuery({
    queryKey: ['followers', fid],
    queryFn: () => fetchFollowers(fid),
    enabled: !!fid
  }) as { data: any[], isLoading: boolean };
  const { data: activitiesRaw = [], isLoading: activitiesLoading } = useQuery({ queryKey: ['all-activities'], queryFn: getActivities }) as { data: any[], isLoading: boolean };
  const followers = followersRaw as any[];
  const activities = activitiesRaw as any[];
  const runcasterFids = useMemo(() => new Set(activities.map((a: any) => a.fid)), [activities]);
  const followersWhoUseRuncaster = useMemo(() => followers.filter((f: any) => runcasterFids.has(f.fid)), [followers, runcasterFids]);
  if (followersLoading || activitiesLoading) return <Text>Loading followers…</Text>;
  if (!followersWhoUseRuncaster.length) return null;
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>Your Followers Using Runcaster</Text>
      <Stack spacing={3}>
        {followersWhoUseRuncaster.map((user: any) => (
          <HStack key={user.fid} spacing={3}>
            <Avatar size="sm" src={user.pfp_url} name={user.display_name || user.username} />
            <Text fontWeight="medium">@{user.username}</Text>
          </HStack>
        ))}
      </Stack>
    </Box>
  );
}

export function Discover() {
  // Get current user FID
  const [fid, setFid] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).sdk?.context?.user?.fid) {
      setFid((window as any).sdk.context.user.fid);
    }
  }, []);
  // Get all activities and unique FIDs
  const { data: activities = [] } = useQuery({ queryKey: ['all-activities'], queryFn: getActivities });
  const uniqueFids = useMemo(() => Array.from(new Set((activities as any[]).map((a: any) => a.fid))), [activities]);
  // Batch fetch all profiles
  const { data: profileMap = {} } = useQuery({
    queryKey: ['profile-batch', uniqueFids.join(',')],
    queryFn: () => fetchProfilesByFids(uniqueFids),
    enabled: uniqueFids.length > 0
  }) as { data: Record<number, any> };
  return (
    <Stack spacing={8} p={4}>
      {fid && <FollowersUsingRuncasterSection fid={fid} />}
      <LocationFacetedActivitiesSection profileMap={profileMap} />
      <HiddenGemsSection profileMap={profileMap} />
    </Stack>
  );
} 