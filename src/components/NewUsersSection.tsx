import React from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Flex,
  Avatar,
  Text,
  Button,
  useColorModeValue,
  Spinner
} from '@chakra-ui/react';
import { sdk } from '@farcaster/frame-sdk';
import { Activity } from '../lib/supabase';

interface NewUsersSectionProps {
  isLoading: boolean;
  profileMap: Record<number, any>;
  activities: Activity[];
}

export function NewUsersSection({ isLoading, profileMap, activities }: NewUsersSectionProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Find new users based on their first activity
  const findNewUsers = () => {
    const userFirstActivity: Record<number, { 
      fid: number,
      firstActivityDate: string 
    }> = {};
    
    // Find first activity for each user
    activities.forEach(activity => {
      if (!userFirstActivity[activity.fid] || 
          new Date(activity.created_at) < new Date(userFirstActivity[activity.fid].firstActivityDate)) {
        userFirstActivity[activity.fid] = {
          fid: activity.fid,
          firstActivityDate: activity.created_at
        };
      }
    });
    
    // Convert to array and sort by date (newest first)
    const users = Object.values(userFirstActivity).sort((a, b) => 
      new Date(b.firstActivityDate).getTime() - new Date(a.firstActivityDate).getTime()
    );
    
    // Return top 4 newest users that have profile data
    return users
      .filter(user => profileMap[user.fid])
      .slice(0, 4)
      .map(user => ({
        fid: user.fid,
        username: profileMap[user.fid]?.username,
        displayName: profileMap[user.fid]?.display_name,
        avatarUrl: profileMap[user.fid]?.pfp_url,
        joinedDate: new Date(user.firstActivityDate)
      }));
  };
  
  const newUsers = findNewUsers();
  
  const handleProfileClick = (fid: number) => {
    try {
      sdk.actions.viewProfile({ fid });
    } catch (error) {
      console.error('Error opening profile:', error);
      // If SDK method fails, try window.open as fallback
      const username = profileMap[fid]?.username;
      if (username) {
        window.open(`https://warpcast.com/${username}`, '_blank');
      }
    }
  };
  
  // Format relative time for user joined date
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      borderColor={borderColor}
      boxShadow="sm"
      p={4}
    >
      <Heading size="md" mb={4}>New Runners & Cyclists</Heading>
      
      {isLoading ? (
        <Flex justify="center" p={8}>
          <Spinner />
        </Flex>
      ) : newUsers.length > 0 ? (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
          {newUsers.map(user => (
            <Box 
              key={user.fid}
              p={3}
              borderWidth="1px"
              borderRadius="md"
              borderColor={borderColor}
              cursor="pointer"
              _hover={{ borderColor: 'orange.300' }}
              onClick={() => handleProfileClick(user.fid)}
            >
              <Flex direction="column" align="center" textAlign="center">
                <Avatar 
                  size="lg" 
                  src={user.avatarUrl} 
                  name={user.displayName || user.username || `User ${user.fid}`}
                  mb={2}
                />
                <Text fontWeight="bold" noOfLines={1}>
                  {user.displayName || user.username || `User ${user.fid}`}
                </Text>
                {user.username && (
                  <Text fontSize="sm" color="gray.500" mb={2}>@{user.username}</Text>
                )}
                <Text fontSize="xs" color="gray.500">
                  Joined {formatRelativeTime(user.joinedDate)}
                </Text>
                <Button 
                  size="xs" 
                  colorScheme="orange" 
                  variant="outline"
                  mt={2}
                  w="full"
                >
                  Follow
                </Button>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Flex justify="center" p={8}>
          <Text color="gray.500">No new users found</Text>
        </Flex>
      )}
    </Box>
  );
} 