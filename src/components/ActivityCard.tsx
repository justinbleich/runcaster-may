import { Box, Text, Flex, Badge, Avatar, Stack, useColorModeValue } from "@chakra-ui/react";

// Helper to generate Google Static Maps URL from route array
function getStaticMapUrl(route: { lat: number; lng: number }[], apiKey?: string) {
  if (!route || route.length === 0) return "";
  const base = "https://maps.googleapis.com/maps/api/staticmap";
  const size = "400x200";
  const path =
    "path=color:0x4285F4FF|weight:4|" +
    route.map((p) => `${p.lat},${p.lng}`).join("|");
  const markers = route.length > 0 ? `&markers=color:green|label:S|${route[0].lat},${route[0].lng}&markers=color:red|label:F|${route[route.length-1].lat},${route[route.length-1].lng}` : "";
  const key = apiKey ? `&key=${apiKey}` : "";
  return `${base}?size=${size}&${path}${markers}${key}`;
}

export interface ActivityCardProps {
  activity: {
    id: string;
    user_address: string;
    type: "run" | "bike";
    distance: number;
    duration: number;
    created_at: string;
    name?: string;
    description?: string;
    is_public: boolean;
    route?: { lat: number; lng: number }[];
  };
  user?: {
    avatarUrl?: string;
    name?: string;
  };
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ActivityCard({ activity, user }: ActivityCardProps) {
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const typeColor = activity.type === "run" ? "orange.400" : "blue.400";
  const date = new Date(activity.created_at);
  return (
    <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={4} mb={4}>
      <Flex align="center" mb={2} gap={3}>
        {user?.avatarUrl && <Avatar size="sm" src={user.avatarUrl} name={user.name} />}
        <Stack spacing={0} flex={1}>
          <Text fontWeight="bold" fontSize="md">
            {activity.name || `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} on ${date.toLocaleDateString()}`}
          </Text>
          <Text fontSize="xs" color={mutedColor}>{date.toLocaleString()}</Text>
        </Stack>
        <Badge colorScheme={activity.type === "run" ? "orange" : "blue"} variant="subtle">
          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
        </Badge>
        {!activity.is_public && (
          <Badge colorScheme="gray" ml={2} variant="outline">Private</Badge>
        )}
      </Flex>
      {activity.route && activity.route.length > 1 && (
        <Box mb={3} borderRadius="md" overflow="hidden">
          <img
            src={getStaticMapUrl(activity.route)}
            alt="Route preview"
            style={{ width: "100%", borderRadius: 8 }}
          />
        </Box>
      )}
      <Flex gap={4} mb={2}>
        <Text fontSize="sm" color={typeColor} fontWeight="semibold">
          {activity.distance.toFixed(2)} km
        </Text>
        <Text fontSize="sm" color={mutedColor}>
          {formatTime(activity.duration)}
        </Text>
      </Flex>
      {activity.description && (
        <Text fontSize="sm" color={mutedColor} mb={1}>
          {activity.description}
        </Text>
      )}
    </Box>
  );
} 