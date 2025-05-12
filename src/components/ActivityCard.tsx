import { Box, Text, Flex, Badge, Avatar, Stack, useColorModeValue, Button } from "@chakra-ui/react";
import { useState } from "react";
import { TippingModal } from "./TippingModal";
import { truncateAddress } from '../lib/farcaster';
import polyline from 'polyline';

// Helper to generate Mapbox Static Images URL from route array
function getMapboxStaticUrl(route: { lat: number; lng: number }[], aspect: 'square' | 'wide' = 'square') {
  if (!route || route.length === 0) return '';
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const style = 'mapbox/streets-v11';
  const width = aspect === 'square' ? 400 : 400;
  const height = aspect === 'square' ? 400 : 225; // 16:9 is 400x225
  // Mapbox expects [lng, lat] pairs
  const coords = route.map(p => [p.lng, p.lat]);
  const encoded = polyline.encode(coords);
  const path = `path-5+f44-0.5(${encoded})`;
  // Center on route
  const center = coords.length > 0 ? coords[Math.floor(coords.length / 2)] : [0, 0];
  return `https://api.mapbox.com/styles/v1/${style}/static/${path}/auto/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
}

export interface ActivityCardProps {
  activity: {
    id: string;
    user_address: string;
    type: "run" | "bike";
    distance: number;
    duration: number;
    created_at: string;
    title?: string;
    description?: string;
    is_public: boolean;
    route?: { lat: number; lng: number }[];
    show_map?: boolean;
  };
  user?: {
    avatarUrl?: string;
    name?: string;
  };
  showTipping?: boolean;
  aspect?: 'square' | 'wide';
  showMap?: boolean;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}

export function ActivityCard({ activity, user, showTipping = true, aspect = 'square', showMap = true }: ActivityCardProps) {
  const [showTipModal, setShowTipModal] = useState(false);
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const typeColor = activity.type === "run" ? "orange.400" : "blue.400";
  const date = new Date(activity.created_at);

  return (
    <>
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={4} mb={4}>
        <Flex align="center" mb={2} gap={3}>
          {user?.avatarUrl && <Avatar size="sm" src={user.avatarUrl} name={user.name} />}
          <Stack spacing={0} flex={1}>
            <Text fontWeight="bold" fontSize="md">
              {activity.title || `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} on ${date.toLocaleDateString()}`}
            </Text>
            <Text fontSize="xs" color={mutedColor}>{date.toLocaleString()}</Text>
            <Text fontSize="xs" color={mutedColor}>{truncateAddress(activity.user_address)}</Text>
          </Stack>
          <Badge colorScheme={activity.type === "run" ? "orange" : "blue"} variant="subtle">
            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
          </Badge>
          {!activity.is_public && (
            <Badge colorScheme="gray" ml={2} variant="outline">Private</Badge>
          )}
        </Flex>
        {showMap && activity.route && activity.route.length > 1 && (
          <Box mb={3} borderRadius="md" overflow="hidden">
            <img
              src={getMapboxStaticUrl(activity.route, aspect)}
              alt="Route preview"
              style={{ width: "100%", borderRadius: 8, aspectRatio: aspect === 'square' ? '1 / 1' : '16 / 9' }}
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
        <Flex justify="flex-end" mt={2}>
          {showTipping !== false && (
            <Button
              size="sm"
              variant="outline"
              colorScheme="orange"
              onClick={() => setShowTipModal(true)}
            >
              Tip
            </Button>
          )}
        </Flex>
      </Box>
      {showTipping !== false && (
        <TippingModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          recipientAddress={activity.user_address}
          activityTitle={activity.title}
        />
      )}
    </>
  );
} 