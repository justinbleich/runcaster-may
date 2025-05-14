import { Box, Text, Flex, Badge, Avatar, Stack, useColorModeValue, Button, Icon } from "@chakra-ui/react";
import { useState } from "react";
import { TippingModal } from "./TippingModal";
import { truncateAddress } from '../lib/farcaster';
import { calculatePace } from '../lib/pace';
import { FaRunning, FaBiking, FaWalking } from 'react-icons/fa';
import { TaggedDescription } from './TaggedDescription';

// Helper to generate Mapbox Static Images URL from route array
function getMapboxStaticUrl(route: { lat: number; lng: number }[], aspect: 'square' | 'wide' = 'square', hideStartEnd?: boolean) {
  if (!route || route.length === 0) {
    console.log('No route data provided for map');
    return '';
  }
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  console.log('Mapbox token present:', !!MAPBOX_TOKEN);
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token is missing. Please add VITE_MAPBOX_TOKEN to your environment variables.');
    return '';
  }
  if (MAPBOX_TOKEN.startsWith('sk.')) {
    console.error('Mapbox secret token detected. Please use a public token (starts with pk.) for client-side code.');
    return '';
  }

  // Calculate the bounding box of the route
  const lats = route.map(p => p.lat);
  const lngs = route.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Create the path for the route
  const path = route.map(p => `${p.lng},${p.lat}`).join(';');
  
  // Add start and end markers unless hidden
  let markers = '';
  if (!hideStartEnd) {
    const startMarker = `pin-s+00ff00(${route[0].lng},${route[0].lat})`;
    const endMarker = `pin-s+ff0000(${route[route.length - 1].lng},${route[route.length - 1].lat})`;
    markers = `${startMarker},${endMarker},`;
  }
  // Calculate the center point
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  
  // Set dimensions based on aspect ratio
  const width = aspect === 'square' ? 400 : 400;
  const height = aspect === 'square' ? 400 : 225; // 16:9 is 400x225
  
  // Construct the URL for the static image with markers
  const url = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${markers}path-5+f44-0.5(${path})/${centerLng},${centerLat},12/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
  console.log('Generated Mapbox URL:', url);
  return url;
}

export interface ActivityCardProps {
  activity: {
    id: string;
    user_address: string;
    type: "run" | "bike" | "walk";
    distance: number;
    duration: number;
    created_at: string;
    title?: string;
    description?: string;
    is_public: boolean;
    route?: { lat: number; lng: number }[];
    show_map?: boolean;
    hide_start_end?: boolean;
    location?: string;
    pace?: string;
  };
  user?: {
    avatarUrl?: string;
    name?: string;
  };
  showTipping?: boolean;
  aspect?: 'square' | 'wide';
  showMap?: boolean;
  likeButtonProps?: {
    liked: boolean;
    likeCount: number;
    onLike: () => void;
    isDisabled: boolean;
  };
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}

export function ActivityCard({ activity, user, showTipping = true, aspect = 'square', showMap = true, likeButtonProps }: ActivityCardProps) {
  const [showTipModal, setShowTipModal] = useState(false);
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const typeColor = activity.type === "run" ? "orange.400" : activity.type === "bike" ? "blue.400" : "green.400";
  const date = new Date(activity.created_at);

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'run':
        return FaRunning;
      case 'bike':
        return FaBiking;
      case 'walk':
        return FaWalking;
      default:
        return FaRunning;
    }
  };

  const getActivityColor = (type: string) => {
    switch(type) {
      case 'run':
        return "orange";
      case 'bike':
        return "blue";
      case 'walk':
        return "green";
      default:
        return "orange";
    }
  };

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
            {activity.location && (
              <Text fontSize="xs" color={mutedColor}>{activity.location}</Text>
            )}
          </Stack>
          <Badge colorScheme={getActivityColor(activity.type)} variant="subtle">
            <Flex align="center" gap={1}>
              <Icon as={getActivityIcon(activity.type)} />
              <Text>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</Text>
            </Flex>
          </Badge>
          {!activity.is_public && (
            <Badge colorScheme="gray" ml={2} variant="outline">Private</Badge>
          )}
        </Flex>
        {showMap && activity.route && activity.route.length > 1 && (() => {
          const mapUrl = getMapboxStaticUrl(activity.route, aspect, activity.hide_start_end);
          console.log('Mapbox URL:', mapUrl, 'Route:', activity.route);
          return (
            <Box mb={3} borderRadius="md" overflow="hidden">
              <img
                src={mapUrl}
                alt="Route preview"
                style={{ width: "100%", borderRadius: 8, aspectRatio: aspect === 'square' ? '1 / 1' : '16 / 9' }}
                onError={(e) => {
                  console.error('Failed to load map image:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Box>
          );
        })()}
        <Flex gap={4} mb={2}>
          <Text fontSize="sm" color={typeColor} fontWeight="semibold">
            {activity.distance.toFixed(2)} km
          </Text>
          <Text fontSize="sm" color={mutedColor}>
            {formatTime(activity.duration)}
          </Text>
          <Text fontSize="sm" color={mutedColor}>
            {activity.pace || calculatePace(activity.distance, activity.duration, activity.type)}
          </Text>
        </Flex>
        {activity.description && (
          <TaggedDescription 
            description={activity.description}
            mutedColor={mutedColor}
          />
        )}
        <Flex justify="flex-end" mt={2}>
          <Stack direction="row" align="center" spacing={2}>
            {likeButtonProps && (
              <>
                <Button
                  aria-label={likeButtonProps.liked ? "Unlike" : "Like"}
                  leftIcon={likeButtonProps.liked ? <span role="img" aria-label="liked">❤️</span> : <span role="img" aria-label="like">🤍</span>}
                  colorScheme={likeButtonProps.liked ? "orange" : "gray"}
                  variant={likeButtonProps.liked ? "solid" : "outline"}
                  size="sm"
                  onClick={likeButtonProps.onLike}
                  isDisabled={likeButtonProps.isDisabled}
                >
                  {likeButtonProps.likeCount}
                </Button>
              </>
            )}
            {showTipping && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="orange"
                onClick={() => setShowTipModal(true)}
              >
                Tip
              </Button>
            )}
          </Stack>
        </Flex>
      </Box>
      {showTipping && (
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