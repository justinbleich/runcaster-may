import { Box, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { getActivities, getLikeCount, hasLiked, likeActivity, unlikeActivity } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityCard } from "./ActivityCard";
import { useFarcasterProfile } from "../lib/farcaster";

function ActivityFeedItem({ activity, address, cardBg, borderColor }: any) {
  const queryClient = useQueryClient();
  const { data: userProfile } = useFarcasterProfile(activity.user_address);

  // Real like state
  const { data: likeCount = 0 } = useQuery({
    queryKey: ['like-count', activity.id],
    queryFn: () => getLikeCount(activity.id),
    staleTime: 1000 * 60,
  });
  const { data: liked = false } = useQuery({
    queryKey: ['liked', activity.id, address],
    queryFn: () => (address ? hasLiked(activity.id, address) : false),
    enabled: !!address,
    staleTime: 1000 * 60,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!address) return;
      if (liked) {
        await unlikeActivity(activity.id, address);
      } else {
        await likeActivity(activity.id, address);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['like-count', activity.id] });
      queryClient.invalidateQueries({ queryKey: ['liked', activity.id, address] });
    },
  });

  return (
    <Box key={activity.id} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
      <ActivityCard 
        activity={activity} 
        user={userProfile ? { avatarUrl: userProfile.avatarUrl, name: userProfile.displayName || userProfile.username } : undefined}
        aspect="square" 
        showMap={activity.show_map !== false}
        showTipping={address && address !== activity.user_address}
        likeButtonProps={{
          liked,
          likeCount,
          onLike: () => likeMutation.mutate(),
          isDisabled: !address || likeMutation.status === "pending",
        }}
      />
    </Box>
  );
}

export function ActivityFeed() {
  const { address } = useAccount();
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: getActivities,
  });

  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Stack spacing={6}>
      {/* Activities Feed */}
      {isLoading ? (
        <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
          <Text textAlign="center" color={useColorModeValue("gray.500", "gray.400")}>Loading activities...</Text>
        </Box>
      ) : !activities?.length ? (
        <Box bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor} p={6}>
          <Text textAlign="center" color={useColorModeValue("gray.500", "gray.400")}>No activities yet</Text>
        </Box>
      ) : (
        <Stack spacing={4}>
          {activities.map((activity) => (
            <ActivityFeedItem
              key={activity.id}
              activity={activity}
              address={address}
              cardBg={cardBg}
              borderColor={borderColor}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
} 