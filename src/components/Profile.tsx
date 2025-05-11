import { Box, Stack, Flex, Text, Heading, Avatar, SimpleGrid, useColorModeValue } from "@chakra-ui/react";
import { useAccount } from "wagmi";

interface Activity {
  id: string;
  type: "run" | "bike";
  distance: number;
  duration: number;
  timestamp: number;
}

// Mock data for demonstration
const mockActivities: Activity[] = [
  {
    id: "1",
    type: "run",
    distance: 5.2,
    duration: 30,
    timestamp: Date.now() - 3600000,
  },
  {
    id: "2",
    type: "bike",
    distance: 15.7,
    duration: 45,
    timestamp: Date.now() - 7200000,
  },
];

export function Profile() {
  const { address } = useAccount();
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (km: number) => {
    return `${km.toFixed(1)} km`;
  };

  const totalDistance = mockActivities.reduce((sum, activity) => sum + activity.distance, 0);
  const totalDuration = mockActivities.reduce((sum, activity) => sum + activity.duration, 0);
  const totalActivities = mockActivities.length;

  if (!address) {
    return (
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
        <Text textAlign="center" color={mutedColor}>
          Please connect your wallet to view your profile
        </Text>
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
        <Stack spacing={4}>
          <Flex align="center" gap={4}>
            <Avatar size="lg" name={address} />
            <Box>
              <Text fontWeight="medium">{address.slice(0, 6)}...{address.slice(-4)}</Text>
              <Text fontSize="sm" color={mutedColor}>Member since {new Date().toLocaleDateString()}</Text>
            </Box>
          </Flex>
          <SimpleGrid columns={3} gap={4}>
            <Box borderRadius="lg" borderWidth={1} borderColor={borderColor} p={4} textAlign="center">
              <Text fontSize="2xl" fontWeight="bold">{totalActivities}</Text>
              <Text fontSize="sm" color={mutedColor}>Activities</Text>
            </Box>
            <Box borderRadius="lg" borderWidth={1} borderColor={borderColor} p={4} textAlign="center">
              <Text fontSize="2xl" fontWeight="bold">{formatDistance(totalDistance)}</Text>
              <Text fontSize="sm" color={mutedColor}>Total Distance</Text>
            </Box>
            <Box borderRadius="lg" borderWidth={1} borderColor={borderColor} p={4} textAlign="center">
              <Text fontSize="2xl" fontWeight="bold">{formatDuration(totalDuration)}</Text>
              <Text fontSize="sm" color={mutedColor}>Total Time</Text>
            </Box>
          </SimpleGrid>
        </Stack>
      </Box>
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
        <Heading as="h3" size="md" mb={4}>Recent Activities</Heading>
        <Stack spacing={4}>
          {mockActivities.map((activity) => (
            <Flex
              key={activity.id}
              align="center"
              justify="space-between"
              borderRadius="lg"
              borderWidth={1}
              borderColor={borderColor}
              p={4}
            >
              <Box>
                <Text fontWeight="medium" textTransform="capitalize">{activity.type}</Text>
                <Text fontSize="sm" color={mutedColor}>
                  {new Date(activity.timestamp).toLocaleDateString()}
                </Text>
              </Box>
              <Box textAlign="right">
                <Text fontWeight="medium">{formatDistance(activity.distance)}</Text>
                <Text fontSize="sm" color={mutedColor}>
                  {formatDuration(activity.duration)}
                </Text>
              </Box>
            </Flex>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
} 