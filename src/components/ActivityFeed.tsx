import { Box, Flex, Stack, Text, Button, Avatar, useColorModeValue, IconButton, HStack } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { getActivities } from "../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { FaRunning, FaBiking, FaMedal, FaMountain, FaHeart, FaRegHeart } from "react-icons/fa";
import { useState } from "react";

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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (km: number) => {
    // Convert to miles for the UI reference
    const miles = km * 0.621371;
    return `${miles.toFixed(2)} mi`;
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
            // Demo: use custom name if present, else fallback
            const customName = activity.name || (activity.type === "run" ? "Morning Run" : "Afternoon Ride");
            const { liked, count, toggle } = useLikeState(activity.id);
            return (
              <Box key={activity.id} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
                <Flex align="center" p={4} gap={3} borderBottomWidth={1} borderColor={borderColor}>
                  {/* Avatar placeholder */}
                  <Avatar size="md" name={activity.user_address} mr={2} />
                  <Box flex={1}>
                    <Text fontWeight="semibold" fontSize="sm">{activity.user_address.slice(0, 6)}...{activity.user_address.slice(-4)}</Text>
                    <Text fontSize="xs" color={mutedColor}>{new Date(activity.created_at).toLocaleString()}</Text>
                  </Box>
                  <Flex align="center" gap={1} color={accent} fontSize="xl">
                    {activity.type === "run" ? <FaRunning /> : <FaBiking />}
                    <Text fontSize="sm" ml={1} fontWeight="bold" color={accent} textTransform="capitalize">
                      {activity.type}
                    </Text>
                  </Flex>
                </Flex>
                <Box p={4}>
                  <Text fontWeight="bold" fontSize="md" mb={1} textTransform="capitalize">
                    {customName}
                  </Text>
                  <HStack spacing={6} mb={2}>
                    <Stack align="center" spacing={0}>
                      <Text fontWeight="semibold">{formatDistance(activity.distance)}</Text>
                      <Text fontSize="xs" color={mutedColor}>Distance</Text>
                    </Stack>
                    <Stack align="center" spacing={0}>
                      <Text fontWeight="semibold">{formatDuration(activity.duration)}</Text>
                      <Text fontSize="xs" color={mutedColor}>Time</Text>
                    </Stack>
                    <Stack align="center" spacing={0}>
                      <Flex align="center" gap={1} fontWeight="semibold"><FaMountain color="#ff5500" /> 0</Flex>
                      <Text fontSize="xs" color={mutedColor}>Elevation</Text>
                    </Stack>
                    <Stack align="center" spacing={0}>
                      <Flex align="center" gap={1} fontWeight="semibold"><FaMedal color="#ff5500" /> 0</Flex>
                      <Text fontSize="xs" color={mutedColor}>Achievements</Text>
                    </Stack>
                  </HStack>
                  {/* Map Placeholder */}
                  <Box w="full" h="32" bg={mutedColor} borderRadius="md" display="flex" alignItems="center" justifyContent="center" color="gray.700" fontSize="sm" mb={2}>
                    Map Placeholder
                  </Box>
                  <Flex justify="space-between" align="center" mt={2}>
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
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
} 