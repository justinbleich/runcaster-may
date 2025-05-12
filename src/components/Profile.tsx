import { Box, Stack, Flex, Text, Heading, Avatar, SimpleGrid, useColorModeValue, Button, Switch, useToast } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserActivities, supabase } from "../lib/supabase";
import { useFarcasterProfile } from "../lib/farcaster";
import { ActivityCard } from "./ActivityCard";
import { useState } from "react";

export function Profile() {
  const { address } = useAccount();
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const toast = useToast();
  const queryClient = useQueryClient();
  const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY;

  // Farcaster profile
  const { data: userProfile } = useFarcasterProfile(address || "", NEYNAR_API_KEY);

  // User activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["user-activities", address],
    queryFn: () => getUserActivities(address || ""),
    enabled: !!address,
  });

  // Toggle public/private
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_public }: { id: string; is_public: boolean }) => {
      const { error } = await supabase.from("activities").update({ is_public }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-activities"] });
    },
    onError: () => {
      toast({ title: "Failed to update visibility", status: "error" });
    },
  });

  // Delete activity
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-activities"] });
      toast({ title: "Activity deleted", status: "success" });
    },
    onError: () => {
      toast({ title: "Failed to delete activity", status: "error" });
    },
  });

  // Stats
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
  const totalActivities = activities.length;

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
      {/* User Info */}
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
        <Flex align="center" gap={4} mb={4}>
          <Avatar size="lg" src={userProfile?.avatarUrl} name={userProfile?.name || address} />
          <Box>
            <Text fontWeight="medium">{userProfile?.name || address.slice(0, 6) + "..." + address.slice(-4)}</Text>
            {userProfile?.name && (
              <Text fontSize="sm" color={mutedColor}>@{userProfile?.name}</Text>
            )}
            <Text fontSize="xs" color={mutedColor}>FID: {userProfile?.fid || "-"}</Text>
          </Box>
        </Flex>
        <SimpleGrid columns={3} gap={4}>
          <Box borderRadius="lg" borderWidth={1} borderColor={borderColor} p={4} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">{totalActivities}</Text>
            <Text fontSize="sm" color={mutedColor}>Activities</Text>
          </Box>
          <Box borderRadius="lg" borderWidth={1} borderColor={borderColor} p={4} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">{totalDistance.toFixed(1)} km</Text>
            <Text fontSize="sm" color={mutedColor}>Total Distance</Text>
          </Box>
          <Box borderRadius="lg" borderWidth={1} borderColor={borderColor} p={4} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</Text>
            <Text fontSize="sm" color={mutedColor}>Total Time</Text>
          </Box>
        </SimpleGrid>
      </Box>
      {/* Activities List */}
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
        <Heading as="h3" size="md" mb={4}>Your Activities</Heading>
        {isLoading ? (
          <Text color={mutedColor}>Loading...</Text>
        ) : !activities.length ? (
          <Text color={mutedColor}>No activities yet</Text>
        ) : (
          <Stack spacing={4}>
            {activities.map((activity) => (
              <Box key={activity.id} position="relative">
                <ActivityCard activity={activity} user={userProfile} />
                <Flex gap={2} align="center" position="absolute" top={2} right={2} zIndex={1}>
                  <Switch
                    size="sm"
                    colorScheme="orange"
                    isChecked={activity.is_public}
                    onChange={() => toggleMutation.mutate({ id: activity.id, is_public: !activity.is_public })}
                  />
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm("Delete this activity?")) deleteMutation.mutate(activity.id);
                    }}
                  >
                    Delete
                  </Button>
                </Flex>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
} 