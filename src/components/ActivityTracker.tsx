import { useState, useRef } from "react";
import { useAccount } from "wagmi";
import { createActivity } from "../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Input,
  FormControl,
  FormLabel,
  Button,
  Stack,
  Heading,
  Select,
  Text,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react";

interface ActivityForm {
  type: "run" | "bike";
  distance: number;
  duration: number;
  name: string;
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

export function ActivityTracker() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activity, setActivity] = useState<ActivityForm>({
    type: "run",
    distance: 0,
    duration: 0,
    name: "",
  });
  const [timer, setTimer] = useState(0); // seconds
  const [liveDistance, setLiveDistance] = useState(0); // km
  const [_path, setPath] = useState<{ lat: number; lng: number }[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const geoWatchId = useRef<number | null>(null);

  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const handleStartTracking = () => {
    setIsTracking(true);
    setTimer(0);
    setLiveDistance(0);
    setPath([]);
    setShowSummary(false);
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
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    try {
      setIsSubmitting(true);
      await createActivity({
        user_address: address,
        type: activity.type,
        distance: activity.distance,
        duration: activity.duration,
        name: activity.name,
      });
      // Reset form
      setActivity({
        type: "run",
        distance: 0,
        duration: 0,
        name: "",
      });
      setTimer(0);
      setLiveDistance(0);
      setPath([]);
      setShowSummary(false);
      // Invalidate queries to refetch activities
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    } catch (error) {
      console.error("Error creating activity:", error);
    } finally {
      setIsSubmitting(false);
    }
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
          {isTracking ? (
            <Stack spacing={4} align="center">
              <Text fontSize="2xl" fontWeight="bold">{formatTime(timer)}</Text>
              <Text color={mutedColor}>Distance: {liveDistance.toFixed(2)} km</Text>
              <Button colorScheme="red" w="full" onClick={handleStopTracking}>
                Stop Tracking
              </Button>
            </Stack>
          ) : showSummary ? (
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Activity Name</FormLabel>
                  <Input
                    placeholder="e.g. Climbing to Cloud Nine"
                    value={activity.name}
                    onChange={(e) => setActivity({ ...activity, name: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Activity Type</FormLabel>
                  <Select
                    value={activity.type}
                    onChange={(e) => setActivity({ ...activity, type: e.target.value as "run" | "bike" })}
                  >
                    <option value="run">Run</option>
                    <option value="bike">Bike</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Distance (km)</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={activity.distance}
                    onChange={(e) => setActivity({ ...activity, distance: parseFloat(e.target.value) })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Duration (minutes)</FormLabel>
                  <Input
                    type="number"
                    value={activity.duration}
                    onChange={(e) => setActivity({ ...activity, duration: parseInt(e.target.value) })}
                  />
                </FormControl>
                <Flex gap={2}>
                  <Button type="submit" colorScheme="orange" flex={1} isLoading={isSubmitting}>
                    Save Activity
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    colorScheme="orange"
                    flex={1}
                    onClick={() => {
                      setShowSummary(false);
                      setTimer(0);
                      setLiveDistance(0);
                      setPath([]);
                    }}
                  >
                    Discard
                  </Button>
                </Flex>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Activity Name</FormLabel>
                  <Input
                    placeholder="e.g. Climbing to Cloud Nine"
                    value={activity.name}
                    onChange={(e) => setActivity({ ...activity, name: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Activity Type</FormLabel>
                  <Select
                    value={activity.type}
                    onChange={(e) => setActivity({ ...activity, type: e.target.value as "run" | "bike" })}
                  >
                    <option value="run">Run</option>
                    <option value="bike">Bike</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Distance (km)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    value={activity.distance}
                    onChange={(e) => setActivity({ ...activity, distance: parseFloat(e.target.value) })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Duration (minutes)</FormLabel>
                  <Input
                    type="number"
                    value={activity.duration}
                    onChange={(e) => setActivity({ ...activity, duration: parseInt(e.target.value) })}
                  />
                </FormControl>
                <Flex gap={2}>
                  <Button type="submit" colorScheme="orange" flex={1} isLoading={isSubmitting}>
                    Save Activity
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    colorScheme="orange"
                    flex={1}
                    onClick={handleStartTracking}
                  >
                    Start Tracking
                  </Button>
                </Flex>
              </Stack>
            </form>
          )}
        </Box>
      </Box>
    </Stack>
  );
} 