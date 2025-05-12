import { Box, Flex, Stack, Text, Button, useColorModeValue, IconButton, HStack } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { getActivities } from "../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useState } from "react";
import { ActivityCard } from "./ActivityCard";
import { useFarcasterProfile } from "../lib/farcaster";

// Dummy weekly snapshot data for now
const weeklyStats = {
  activities: 10,
  time: 459, // minutes
  distance: 58.83, // miles
};

function formatWeeklyTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

// Dummy like state for demo
function useLikeState(_activityId: string) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(Math.floor(Math.random() * 10));
  const toggle = () => {
    setLiked((v) => !v);
    setCount((c) => (liked ? c - 1 : c + 1));
  };
  return { liked, count, toggle };
}

const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY;

export function ActivityFeed() {
  const { address } = useAccount();
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: getActivities,
  });

  const handleTip = async (_activityId: string) => {
    // TODO: Implement tipping functionality with USDC
    console.log("Tipping activity:", _activityId);
  };

  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const accent = "orange.500";

  return (
    <Stack spacing={6}>
      {/* Weekly Snapshot */}
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={4}>
        <Text fontSize="xs" color={mutedColor} fontWeight="bold" mb={2}>
          Your Weekly Snapshot
        </Text>
        <Flex justify="space-between" align="center">
          <Stack align="center" spacing={0}>
            <Text fontWeight="bold" fontSize="lg" color={accent}>{weeklyStats.activities}</Text>
            <Text fontSize="xs" color={mutedColor}>Activities</Text>
          </Stack>
          <Stack align="center" spacing={0}>
            <Text fontWeight="bold" fontSize="lg">{formatWeeklyTime(weeklyStats.time)}</Text>
            <Text fontSize="xs" color={mutedColor}>Time</Text>
          </Stack>
          <Stack align="center" spacing={0}>
            <Text fontWeight="bold" fontSize="lg">{weeklyStats.distance.toFixed(2)}</Text>
            <Text fontSize="xs" color={mutedColor}>Distance</Text>
          </Stack>
        </Flex>
      </Box>

      {/* Activities Feed */}
      {isLoading ? (
        <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
          <Text textAlign="center" color={mutedColor}>Loading activities...</Text>
        </Box>
      ) : !activities?.length ? (
        <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
          <Text textAlign="center" color={mutedColor}>No activities yet</Text>
        </Box>
      ) : (
        <Stack spacing={4}>
          {activities.map((activity) => {
            const { liked, count, toggle } = useLikeState(activity.id);
            // Fetch Farcaster profile for the user
            const { data: userProfile } = useFarcasterProfile(activity.user_address, NEYNAR_API_KEY);
            return (
              <Box key={activity.id} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
                <ActivityCard
                  activity={activity}
                  user={userProfile}
                />
                <Flex justify="space-between" align="center" mt={2} px={4} pb={2}>
                  <HStack>
                    <IconButton
                      aria-label={liked ? "Unlike" : "Like"}
                      icon={liked ? <FaHeart /> : <FaRegHeart />}
                      colorScheme={liked ? "orange" : "gray"}
                      variant={liked ? "solid" : "ghost"}
                      size="sm"
                      onClick={toggle}
                    />
                    <Text fontSize="sm" color={mutedColor}>{count}</Text>
                  </HStack>
                  {address && address !== activity.user_address && (
                    <Button
                      variant="outline"
                      colorScheme="orange"
                      size="sm"
                      onClick={() => handleTip(activity.id)}
                    >
                      Tip with USDC
                    </Button>
                  )}
                </Flex>
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
} 