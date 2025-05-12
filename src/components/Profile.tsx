import {
  Box, Stack, Flex, Text, Heading, Avatar, SimpleGrid, useColorModeValue, Button, Switch, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, IconButton, Menu, MenuButton, MenuList, MenuItem
} from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserActivities, supabase } from "../lib/supabase";
import { useFarcasterProfile } from "../lib/farcaster";
import { ActivityCard } from "./ActivityCard";
import { useState, useRef } from "react";
import { FiMoreVertical } from "react-icons/fi";

export function Profile() {
  const { address } = useAccount();
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const toast = useToast();
  const queryClient = useQueryClient();

  // Farcaster profile
  const { data: userProfile } = useFarcasterProfile(address || "");

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

  // Modal state for delete and actions
  const [actionId, setActionId] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"delete" | "toggle" | null>(null);
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
      <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={8} textAlign="center">
        <Avatar size="2xl" src={userProfile?.avatarUrl} name={userProfile?.displayName || userProfile?.username || address} mb={3} />
        <Text fontWeight="bold" fontSize="2xl">{userProfile?.displayName || userProfile?.username || address.slice(0, 6) + "..." + address.slice(-4)}</Text>
        {userProfile?.username && (
          <Text fontSize="md" color={mutedColor}>@{userProfile?.username}</Text>
        )}
        <Text fontSize="sm" color={mutedColor} mb={2}>FID: {userProfile?.fid || "-"}</Text>
        <SimpleGrid columns={3} gap={4} maxW="400px" mx="auto">
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
                <ActivityCard activity={activity} user={userProfile ? { avatarUrl: userProfile.avatarUrl, name: userProfile.displayName || userProfile.username } : undefined} />
                <Flex gap={2} align="center" position="absolute" top={2} right={2} zIndex={1}>
                  <Menu>
                    <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
                    <MenuList>
                      <MenuItem onClick={() => { setActionId(activity.id); setPendingAction("toggle"); setShowActionModal(true); }}>
                        {activity.is_public ? "Make Private" : "Make Public"}
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
                onClick={() => {
                  if (actionId && pendingAction === "delete") {
                    console.log("Deleting activity with id:", actionId);
                    deleteMutation.mutate(actionId);
                  }
                  if (actionId && pendingAction === "toggle") {
                    const activity = activities.find(a => a.id === actionId);
                    if (activity) {
                      console.log("Toggling visibility for activity:", actionId, "to", !activity.is_public);
                      toggleMutation.mutate({ id: actionId, is_public: !activity.is_public });
                    }
                  }
                  setShowActionModal(false); setActionId(null); setPendingAction(null);
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