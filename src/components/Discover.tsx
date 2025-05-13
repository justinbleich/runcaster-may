import { useState } from "react";
import { Stack, Box, Text, Avatar, HStack } from "@chakra-ui/react";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { getActivities } from "../lib/supabase";
import { sdk } from "@farcaster/frame-sdk";
import { useFarcasterProfile } from "../lib/farcaster";

// Fetch user profile from Neynar /user/bulk endpoint
async function fetchBulkUser() {
  const apiKey = import.meta.env.VITE_NEYNAR_API_KEY;
  if (!apiKey) throw new Error('Missing NEYNAR_API_KEY');
  let fid = 1;
  if (typeof window !== 'undefined' && (window as any).sdk?.context?.user?.fid) {
    fid = (window as any).sdk.context.user.fid;
  }
  const res = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
    headers: { 'x-api-key': apiKey }
  });
  if (!res.ok) throw new Error('Neynar bulk user fetch failed');
  const data = await res.json();
  return (data.users || []).map((user: any) => ({
    fid: user.fid,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.pfp_url,
  }));
}

function SuggestedFollowsSection() {
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["bulk-user-profile"],
    queryFn: fetchBulkUser,
  });
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>Your Farcaster Profile (Bulk API)</Text>
      <Stack spacing={3}>
        {isLoading && <Text>Loading...</Text>}
        {error && <Text color="red.500">Error loading user</Text>}
        {!isLoading && !error && users.map((user: any) => (
          <HStack key={user.fid} spacing={3}>
            <Avatar size="sm" src={user.avatarUrl} name={user.displayName || user.username} />
            <Text fontWeight="medium">@{user.username}</Text>
            <Button size="sm" variant="outline" onClick={() => sdk.actions.viewProfile({ fid: user.fid })}>
              View Profile
            </Button>
          </HStack>
        ))}
      </Stack>
    </Box>
  );
}

function ActivityUser({ fid }: { fid: number }) {
  const { data: profile } = useFarcasterProfile("", fid);
  return (
    <HStack spacing={2}>
      <Avatar size="sm" src={profile?.avatarUrl} name={profile?.displayName || profile?.username || String(fid)} />
      <Text fontWeight="medium">{profile?.displayName || profile?.username || `FID ${fid}`}</Text>
    </HStack>
  );
}

function LocationFacetedActivitiesSection() {
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
        {isLoading ? <Text>Loading...</Text> : filteredActivities.map(activity => (
          <Box key={activity.id} p={3} borderWidth={1} borderRadius="md">
            <HStack spacing={3}>
              <ActivityUser fid={activity.fid} />
              <Text fontWeight="medium">{activity.title || 'Untitled'}</Text>
              <Text color="gray.500">FID: {activity.fid}</Text>
            </HStack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function HiddenGemsSection() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["all-activities"],
    queryFn: getActivities,
  });
  // Group by fid
  const userMap = new Map();
  activities.forEach(a => {
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
        {isLoading ? <Text>Loading...</Text> : hiddenGems.map(user => (
          <HStack key={user.fid} spacing={3}>
            <ActivityUser fid={user.fid} />
            <Button size="sm" variant="outline" onClick={() => sdk.actions.viewProfile({ fid: user.fid })}>
              Follow
            </Button>
          </HStack>
        ))}
      </Stack>
    </Box>
  );
}

export function Discover() {
  return (
    <Stack spacing={8} p={4}>
      <SuggestedFollowsSection />
      <LocationFacetedActivitiesSection />
      <HiddenGemsSection />
    </Stack>
  );
} 