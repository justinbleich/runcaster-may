import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { createActivity } from "../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { sdk } from "@farcaster/frame-sdk";
import { calculatePaceFromSeconds } from '../lib/pace';
import {
  Box,
  Input,
  FormControl,
  FormLabel,
  Button,
  Stack,
  Heading,
  Text,
  useColorModeValue,
  Flex,
  Switch,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";

interface ActivityForm {
  type: "run" | "bike" | "walk";
  distance: number;
  duration: number;
  title: string;
  description?: string;
  is_public: boolean;
  route: { lat: number; lng: number }[];
  start_time?: number;
  end_time?: number;
  show_map?: boolean;
  hide_start_end?: boolean;
  location?: string;
  pace?: string;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

export function ActivityTracker() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [fid, setFid] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activity, setActivity] = useState<ActivityForm>({
    type: "run",
    distance: 0,
    duration: 0,
    title: "",
    is_public: false,
    route: [],
    start_time: undefined,
    end_time: undefined,
    hide_start_end: false,
    location: "",
    pace: undefined,
  });
  const [timer, setTimer] = useState(0); // seconds
  const [liveDistance, setLiveDistance] = useState(0); // km
  const [_path, setPath] = useState<{ lat: number; lng: number }[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const geoWatchId = useRef<number | null>(null);
  const [activityType, setActivityType] = useState<"run" | "bike" | "walk">("run");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    const getFid = async () => {
      try {
        const context = await sdk.context;
        if (context.user?.fid) {
          setFid(context.user.fid);
        }
      } catch (error) {
        console.error("Error getting Farcaster context:", error);
      }
    };
    getFid();
  }, []);

  const handleStartTracking = () => {
    setIsTracking(true);
    setTimer(0);
    setLiveDistance(0);
    setPath([]);
    setShowSummary(false);
    setErrorMsg(null);
    setActivity((a) => ({
      ...a,
      start_time: Date.now(),
      route: [],
    }));
    // Start timer
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    // Start geolocation
    if (navigator.geolocation) {
      geoWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPath((prev) => {
            if (prev.length === 0) return [{ lat: latitude, lng: longitude }];
            const last = prev[prev.length - 1];
            const dist = haversineDistance(last.lat, last.lng, latitude, longitude);
            setLiveDistance((d) => d + dist);
            return [...prev, { lat: latitude, lng: longitude }];
          });
        },
        (_err) => {
          // Optionally show error
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    setShowSummary(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (geoWatchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(geoWatchId.current);
    }
    // Pre-fill summary form
    setActivity((a) => ({
      ...a,
      distance: parseFloat(liveDistance.toFixed(3)),
      duration: Math.round(timer / 60), // minutes
      type: activityType,
      route: _path,
      end_time: Date.now(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !fid) {
      setErrorMsg("Missing required information");
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await createActivity({
        fid,
        user_address: address,
        type: activity.type,
        distance: Number(activity.distance),
        duration: Math.round(Number(activity.duration)),
        title: activity.title,
        description: activity.description,
        is_public: activity.is_public,
        route: activity.route,
        start_time: activity.start_time,
        end_time: activity.end_time,
        show_map: activity.show_map !== false,
        hide_start_end: activity.hide_start_end === true,
      });
      // Reset form
      setActivity({
        type: "run",
        distance: 0,
        duration: 0,
        title: "",
        is_public: false,
        route: [],
        start_time: undefined,
        end_time: undefined,
        hide_start_end: false,
        location: "",
        pace: undefined,
      });
      setTimer(0);
      setLiveDistance(0);
      setPath([]);
      setShowSummary(false);
      // Invalidate queries to refetch activities
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["user-activities"] });
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to save activity");
      console.error("Error creating activity:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    setShowSummary(false);
    setActivity({
      type: "run",
      distance: 0,
      duration: 0,
      title: "",
      is_public: false,
      route: [],
      start_time: undefined,
      end_time: undefined,
      hide_start_end: false,
      location: "",
      pace: undefined,
    });
    setTimer(0);
    setLiveDistance(0);
    setPath([]);
    setShowCancelModal(false);
  };

  if (!address) {
    return (
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
        <Text textAlign="center" color={mutedColor}>
          Please connect your wallet to track activities
        </Text>
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
        <Box p={6} borderBottomWidth={1} borderColor={borderColor}>
          <Heading as="h3" size="md">Track Activity</Heading>
        </Box>
        <Box p={6}>
          {!isTracking && !showSummary && (
            <Stack spacing={4} align="center">
              <Text fontWeight="medium">Activity Type</Text>
              <Flex align="center" gap={4} wrap="wrap">
                <Button
                  colorScheme={activityType === "run" ? "orange" : "gray"}
                  variant={activityType === "run" ? "solid" : "outline"}
                  onClick={() => setActivityType("run")}
                >
                  Run
                </Button>
                <Button
                  colorScheme={activityType === "bike" ? "orange" : "gray"}
                  variant={activityType === "bike" ? "solid" : "outline"}
                  onClick={() => setActivityType("bike")}
                >
                  Bike
                </Button>
                <Button
                  colorScheme={activityType === "walk" ? "orange" : "gray"}
                  variant={activityType === "walk" ? "solid" : "outline"}
                  onClick={() => setActivityType("walk")}
                >
                  Walk
                </Button>
              </Flex>
              <Button colorScheme="orange" w="full" onClick={handleStartTracking}>
                Start Tracking
              </Button>
            </Stack>
          )}
          {isTracking ? (
            <Stack spacing={4} align="center">
              <Text fontSize="2xl" fontWeight="bold">{formatTime(timer)}</Text>
              <Text color={mutedColor}>Distance: {liveDistance.toFixed(2)} km</Text>
              <Text color={mutedColor}>
                Pace: {calculatePaceFromSeconds(liveDistance, timer, activityType)}
              </Text>
              <Text color={mutedColor}>Type: {activityType.charAt(0).toUpperCase() + activityType.slice(1)}</Text>
              <Button colorScheme="red" w="full" onClick={handleStopTracking}>
                Stop Tracking
              </Button>
            </Stack>
          ) : showSummary ? (
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <Text fontWeight="medium">Type: {activityType.charAt(0).toUpperCase() + activityType.slice(1)}</Text>
                <Text>Duration: {formatTime(timer)}</Text>
                <Text>Distance: {liveDistance.toFixed(2)} km</Text>
                <Text>Pace: {calculatePaceFromSeconds(liveDistance, timer, activityType)}</Text>
                {/* Static map preview */}
                {_path.length > 1 && (
                  <Box>
                    <img
                      src={getStaticMapUrl(_path)}
                      alt="Route preview"
                      style={{ width: "100%", borderRadius: 8, marginBottom: 8 }}
                    />
                  </Box>
                )}
                <FormControl>
                  <FormLabel fontSize="sm">Activity Name</FormLabel>
                  <Input
                    placeholder="e.g. Climbing to Cloud Nine"
                    value={activity.title}
                    onChange={(e) => setActivity({ ...activity, title: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Input
                    placeholder="Optional description"
                    value={activity.description || ""}
                    onChange={(e) => setActivity({ ...activity, description: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Location</FormLabel>
                  <Input
                    placeholder="e.g. San Francisco, CA"
                    value={activity.location || ""}
                    onChange={(e) => setActivity({ ...activity, location: e.target.value })}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel fontSize="sm" mb={0}>Share Publicly?</FormLabel>
                  <Switch
                    isChecked={activity.is_public}
                    onChange={(e) => setActivity({ ...activity, is_public: e.target.checked })}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel fontSize="sm" mb={0}>Hide Start/End Points?</FormLabel>
                  <Switch
                    isChecked={activity.hide_start_end}
                    onChange={(e) => setActivity({ ...activity, hide_start_end: e.target.checked })}
                  />
                </FormControl>
                {errorMsg && (
                  <Text color="red.500" fontSize="sm">{errorMsg}</Text>
                )}
                <Flex gap={2}>
                  <Button
                    colorScheme="orange"
                    type="submit"
                    isLoading={isSubmitting}
                    w="full"
                  >
                    Save Activity
                  </Button>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={handleCancel}
                    w="full"
                  >
                    Cancel
                  </Button>
                </Flex>
              </Stack>
            </form>
          ) : null}
        </Box>
      </Box>
      {/* Cancel Warning Modal */}
      <AlertDialog
        isOpen={showCancelModal}
        leastDestructiveRef={cancelRef}
        onClose={() => setShowCancelModal(false)}
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Discard Activity?
          </AlertDialogHeader>
          <AlertDialogBody>
            Are you sure you want to discard this activity? All unsaved data will be lost.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setShowCancelModal(false)}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmCancel} ml={3}>
              Discard
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Stack>
  );
} 