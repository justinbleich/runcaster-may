import { useState } from "react";
import { Stack, Box, Text, Avatar, HStack } from "@chakra-ui/react";
import { Button } from "./ui/button";

// Stub data for now
const suggestedFollows = [
  { fid: 1, username: "alice", displayName: "Alice", avatarUrl: "https://i.pravatar.cc/100?u=alice" },
  { fid: 2, username: "bob", displayName: "Bob", avatarUrl: "https://i.pravatar.cc/100?u=bob" },
];
const activities = [
  { id: 1, location: "Austin", user_display_name: "Alice", user_avatar_url: "https://i.pravatar.cc/100?u=alice", title: "Morning Run" },
  { id: 2, location: "NYC", user_display_name: "Bob", user_avatar_url: "https://i.pravatar.cc/100?u=bob", title: "Central Park Ride" },
  { id: 3, location: "Remote", user_display_name: "Charlie", user_avatar_url: "https://i.pravatar.cc/100?u=charlie", title: "Virtual 5K" },
];
const hiddenGems = [
  { fid: 3, username: "charlie", displayName: "Charlie", avatarUrl: "https://i.pravatar.cc/100?u=charlie" },
];

function SuggestedFollowsSection() {
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>Suggested Follows</Text>
      <Stack spacing={3}>
        {suggestedFollows.map(user => (
          <HStack key={user.fid} spacing={3}>
            <Avatar size="sm" src={user.avatarUrl} name={user.displayName || user.username} />
            <Text fontWeight="medium">@{user.username}</Text>
            <Button size="sm" variant="outline" onClick={() => {/* TODO: open Farcaster profile modal */}}>
              Follow
            </Button>
          </HStack>
        ))}
      </Stack>
    </Box>
  );
}

function LocationFacetedActivitiesSection() {
  const [selectedLocation, setSelectedLocation] = useState('All');
  const locations = Array.from(new Set(activities.map(a => a.location)));
  const filteredActivities = selectedLocation === 'All'
    ? activities
    : activities.filter(a => a.location === selectedLocation);
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>Filter by Location:</Text>
      <HStack spacing={2} mb={4}>
        <Button size="sm" variant={selectedLocation === 'All' ? 'default' : 'outline'} onClick={() => setSelectedLocation('All')}>All</Button>
        {locations.map(loc => (
          <Button key={loc} size="sm" variant={selectedLocation === loc ? 'default' : 'outline'} onClick={() => setSelectedLocation(loc)}>{loc}</Button>
        ))}
      </HStack>
      <Stack spacing={3}>
        {filteredActivities.map(activity => (
          <Box key={activity.id} p={3} borderWidth={1} borderRadius="md">
            <HStack spacing={3}>
              <Avatar size="sm" src={activity.user_avatar_url} name={activity.user_display_name} />
              <Text fontWeight="medium">{activity.title}</Text>
              <Text color="gray.500">{activity.location}</Text>
            </HStack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function HiddenGemsSection() {
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>Hidden Gems</Text>
      <Stack spacing={3}>
        {hiddenGems.map(user => (
          <HStack key={user.fid} spacing={3}>
            <Avatar size="sm" src={user.avatarUrl} name={user.displayName || user.username} />
            <Text fontWeight="medium">@{user.username}</Text>
            <Button size="sm" variant="outline" onClick={() => {/* TODO: open Farcaster profile modal */}}>
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