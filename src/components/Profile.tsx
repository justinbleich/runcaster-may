import {
  Box, Stack, Flex, Text, Heading, Avatar, useColorModeValue, Button, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, IconButton, Menu, MenuButton, MenuList, MenuItem
} from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserActivities, supabase } from "../lib/supabase";
import { useFarcasterProfile, truncateAddress, FarcasterProfile } from "../lib/farcaster";
import { ActivityCard } from "./ActivityCard";
import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { sdk } from "@farcaster/frame-sdk";

export function Profile() {
  const { address } = useAccount();
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const toast = useToast();
  const queryClient = useQueryClient();

  // Only use SDK user data for the profile
  const [typedUserProfile, setTypedUserProfile] = useState<FarcasterProfile | null>(null);
  useEffect(() => {
    const getSdkUser = async () => {
      try {
        const context = await sdk.context;
        if (context.user) {
          setTypedUserProfile({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            avatarUrl: (context.user as any).pfpUrl || (context.user as any).pfp,
            location: context.user.location?.description,
          });
        } else {
          setTypedUserProfile(null);
        }
      } catch (error) {
        setTypedUserProfile(null);
        console.error("Error getting Farcaster context:", error);
      }
    };
    getSdkUser();
  }, []);

  // User activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["user-activities", address],
    queryFn: () => getUserActivities(address || ""),
    enabled: !!address,
  });

  // Toggle public/private
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_public }: { id: string; is_public: boolean }) => {
      console.log("Toggling visibility for activity:", id, "to", is_public);
      const { error } = await supabase.from("activities").update({ is_public }).eq("id", id);
      if (error) {
        console.error("Supabase toggle error:", error, JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Visibility updated", status: "success" });
    },
    onError: (error) => {
      toast({ title: "Failed to update visibility", description: error && typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error), status: "error" });
    },
  });

  // Toggle map visibility
  const mapToggleMutation = useMutation({
    mutationFn: async ({ id, show_map }: { id: string; show_map: boolean }) => {
      const { error } = await supabase.from("activities").update({ show_map }).eq("id", id);
      if (error) {
        console.error("Supabase map toggle error:", error, JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Map visibility updated", status: "success" });
    },
    onError: (error) => {
      toast({ title: "Failed to update map visibility", description: error && typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error), status: "error" });
    },
  });

  // Toggle hide_start_end
  const hideStartEndToggleMutation = useMutation({
    mutationFn: async ({ id, hide_start_end }: { id: string; hide_start_end: boolean }) => {
      const { error } = await supabase.from("activities").update({ hide_start_end }).eq("id", id);
      if (error) {
        console.error("Supabase hide_start_end toggle error:", error, JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Start/End marker visibility updated", status: "success" });
    },
    onError: (error) => {
      toast({ title: "Failed to update marker visibility", description: error && typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error), status: "error" });
    },
  });

  // Delete activity
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Attempting to delete activity with id:", id);
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) {
        console.error("Supabase delete error:", error, JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Activity deleted", status: "success" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete activity", description: error && typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error), status: "error" });
    },
  });

  // Weekly summary (user-specific)
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weeklyActivities = activities.filter(a => {
    const date = typeof a.created_at === 'string' ? parseISO(a.created_at) : new Date(a.created_at);
    return isWithinInterval(date, { start: weekStart, end: weekEnd });
  });
  const weeklyDistance = weeklyActivities.reduce((sum, a) => sum + a.distance, 0);
  const weeklyDuration = weeklyActivities.reduce((sum, a) => sum + a.duration, 0);

  function formatWeeklyTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}h ${min}m`;
  }

  // Modal state for delete and actions
  const [actionId, setActionId] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"delete" | "toggle" | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  if (!address) {
    return (
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
        <Text textAlign="center" color={mutedColor}>
          Please connect your wallet to view your profile
        </Text>
      </Box>
    );
  }

  // Refined Profile header
  return (
    <Stack spacing={4}>
      {/* User Info */}
      {typedUserProfile === null && (
        <Text color="orange.500" textAlign="center">Loading Farcaster profile…</Text>
      )}
      {!typedUserProfile && (
        <Text color="red.500" textAlign="center">No Farcaster profile found for this address.</Text>
      )}
      {typedUserProfile && !typedUserProfile.avatarUrl && (
        <Text color="yellow.500" textAlign="center">No avatar found for this profile.</Text>
      )}
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={8} textAlign="center">
        <Avatar size="2xl" src={typedUserProfile?.avatarUrl} name={typedUserProfile?.displayName || typedUserProfile?.username || address} mb={3} />
        <Text fontWeight="bold" fontSize="2xl">
          {typedUserProfile?.displayName || typedUserProfile?.username || truncateAddress(address)}
        </Text>
        {typedUserProfile?.username && (
          <Text fontSize="md" color={mutedColor}>@{typedUserProfile?.username}</Text>
        )}
        <Text fontSize="sm" color={mutedColor} mb={2}>FID: {typedUserProfile?.fid || "-"}</Text>
        {/* Weekly Summary */}
        <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={4} mt={4}>
          <Text fontSize="xs" color={mutedColor} fontWeight="bold" mb={2}>
            Your Weekly Snapshot
          </Text>
          <Flex justify="space-between" align="center">
            <Stack align="center" spacing={0}>
              <Text fontWeight="bold" fontSize="lg" color="orange.500">{weeklyActivities.length}</Text>
              <Text fontSize="xs" color={mutedColor}>Activities</Text>
            </Stack>
            <Stack align="center" spacing={0}>
              <Text fontWeight="bold" fontSize="lg">{formatWeeklyTime(weeklyDuration)}</Text>
              <Text fontSize="xs" color={mutedColor}>Time</Text>
            </Stack>
            <Stack align="center" spacing={0}>
              <Text fontWeight="bold" fontSize="lg">{weeklyDistance.toFixed(2)}</Text>
              <Text fontSize="xs" color={mutedColor}>Distance</Text>
            </Stack>
          </Flex>
        </Box>
        {/* End Weekly Summary */}
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
                <ActivityCard activity={activity} user={typedUserProfile ? { avatarUrl: typedUserProfile.avatarUrl, name: typedUserProfile.displayName || typedUserProfile.username } : undefined} showTipping={false} aspect="wide" showMap={true} />
                <Flex gap={2} align="center" position="absolute" top={2} right={2} zIndex={1}>
                  <Menu>
                    <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
                    <MenuList>
                      <MenuItem onClick={() => { setActionId(activity.id); setPendingAction("toggle"); setShowActionModal(true); }}>
                        {activity.is_public ? "Make Private" : "Make Public"}
                      </MenuItem>
                      <MenuItem onClick={() => mapToggleMutation.mutate({ id: activity.id, show_map: !activity.show_map })}>
                        {activity.show_map === false ? "Show Map in Feed" : "Hide Map in Feed"}
                      </MenuItem>
                      <MenuItem onClick={() => hideStartEndToggleMutation.mutate({ id: activity.id, hide_start_end: !activity.hide_start_end })}>
                        {activity.hide_start_end ? "Show Start/End Markers" : "Hide Start/End Markers"}
                      </MenuItem>
                      <MenuItem color="red.500" onClick={() => { setActionId(activity.id); setPendingAction("delete"); setShowActionModal(true); }}>
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
      {/* Action Modal (Toggle/Delete) */}
      <AlertDialog
        isOpen={showActionModal}
        leastDestructiveRef={cancelRef}
        onClose={() => { setShowActionModal(false); setActionId(null); setPendingAction(null); }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {pendingAction === "delete" ? "Delete Activity" : "Change Visibility"}
            </AlertDialogHeader>
            <AlertDialogBody>
              {pendingAction === "delete"
                ? "Are you sure you want to delete this activity? This action cannot be undone."
                : "Are you sure you want to change the visibility of this activity?"}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => { setShowActionModal(false); setActionId(null); setPendingAction(null); }}>
                Cancel
              </Button>
              <Button colorScheme={pendingAction === "delete" ? "red" : "orange"} ml={3}
                isLoading={isActionLoading}
                disabled={isActionLoading}
                onClick={() => {
                  setIsActionLoading(true);
                  let timeout = setTimeout(() => setIsActionLoading(false), 10000);
                  if (actionId && pendingAction === "delete") {
                    deleteMutation.mutate(actionId, {
                      onSettled: () => { setIsActionLoading(false); clearTimeout(timeout); }
                    });
                  } else if (actionId && pendingAction === "toggle") {
                    const activity = activities.find(a => a.id === actionId);
                    if (activity) {
                      toggleMutation.mutate({ id: actionId, is_public: !activity.is_public }, {
                        onSettled: () => { setIsActionLoading(false); clearTimeout(timeout); }
                      });
                    } else {
                      setIsActionLoading(false); clearTimeout(timeout);
                    }
                  } else {
                    setIsActionLoading(false); clearTimeout(timeout);
                  }
                }}
              >
                {pendingAction === "delete" ? "Delete" : "Change"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Stack>
  );
} 