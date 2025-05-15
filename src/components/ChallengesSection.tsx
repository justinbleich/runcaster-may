import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Flex,
  Button,
  useColorModeValue,
  useToast,
  Spinner,
  Text
} from '@chakra-ui/react';
import { useQuery } from "@tanstack/react-query";
import { getActivities, Activity } from '../lib/supabase';
import { ChallengeCard } from './ChallengeCard';
import { getActiveChallenges, hasJoinedChallenge } from '../lib/challenges';

interface ChallengesSectionProps {
  userFid?: number;
}

export function ChallengesSection({ userFid }: ChallengesSectionProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();
  
  // Fetch activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['all-activities'],
    queryFn: getActivities
  });
  
  // Fetch challenges from database
  const { data: dbChallenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['active-challenges'],
    queryFn: getActiveChallenges
  });
  
  // Track joined challenges locally 
  const [joinedChallenges, setJoinedChallenges] = useState<Record<string, boolean>>({});
  const [paidChallenges, setPaidChallenges] = useState<Record<string, boolean>>({});
  
  // Check which challenges the user has already joined
  useEffect(() => {
    if (!userFid) return;
    
    const checkJoinedChallenges = async () => {
      const joined: Record<string, boolean> = {};
      const paid: Record<string, boolean> = {};
      
      await Promise.all(dbChallenges.map(async (challenge) => {
        const isJoined = await hasJoinedChallenge(challenge.id, userFid);
        joined[challenge.id] = isJoined;
        // In a real implementation, you would check if the user has paid
        // This would query your database for payment status
        paid[challenge.id] = false; 
      }));
      
      setJoinedChallenges(joined);
      setPaidChallenges(paid);
    };
    
    checkJoinedChallenges();
  }, [userFid, dbChallenges]);
  
  // Calculate challenge progress for the current user
  const calculateChallengeProgress = useMemo(() => {
    if (!userFid) return {};
    
    const userActivities = (activities as Activity[]).filter(a => a.fid === userFid);
    const progress: Record<string, number> = {};
    
    // For each challenge, calculate the user's progress
    dbChallenges.forEach(challenge => {
      if (challenge.activity_type && challenge.target_unit === 'km') {
        // Sum distance for the specified activity type
        const totalDistance = userActivities
          .filter(a => a.type === challenge.activity_type)
          .reduce((sum, a) => sum + a.distance, 0);
          
        // Calculate progress percentage
        progress[challenge.id] = Math.min(
          Math.floor((totalDistance / challenge.target_value) * 100),
          100
        );
      } else if (challenge.target_unit === 'count') {
        // Count activities of the specified type
        const count = userActivities
          .filter(a => !challenge.activity_type || a.type === challenge.activity_type)
          .length;
          
        progress[challenge.id] = Math.min(
          Math.floor((count / challenge.target_value) * 100),
          100
        );
      } else if (challenge.target_unit === 'locations') {
        // Count unique locations
        const uniqueLocations = new Set(
          userActivities
            .filter(a => !challenge.activity_type || a.type === challenge.activity_type)
            .map(a => a.location)
            .filter(Boolean)
        ).size;
        
        progress[challenge.id] = Math.min(
          Math.floor((uniqueLocations / challenge.target_value) * 100),
          100
        );
      }
    });
    
    return progress;
  }, [userFid, activities, dbChallenges]);
  
  const handleJoinChallenge = (challengeId: string) => {
    if (!userFid) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to join a challenge',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Mark the challenge as joined locally
    setJoinedChallenges(prev => ({
      ...prev,
      [challengeId]: true
    }));
    
    toast({
      title: 'Challenge joined!',
      description: 'You will need to pay the entry fee to participate',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  const isLoading = activitiesLoading || challengesLoading;
  
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
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Weekly Challenges</Heading>
        <Button size="sm" variant="ghost" colorScheme="orange">
          See All
        </Button>
      </Flex>
      
      {isLoading ? (
        <Flex justify="center" p={8}>
          <Spinner />
        </Flex>
      ) : dbChallenges.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          {dbChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              id={challenge.id}
              title={challenge.title}
              description={challenge.description}
              progress={calculateChallengeProgress[challenge.id] || 0}
              participants={10} // This would be fetched from the database in a real app
              endDate={new Date(challenge.end_date).toLocaleDateString()}
              activityType={challenge.activity_type || undefined}
              isJoined={joinedChallenges[challenge.id] || false}
              hasPaid={paidChallenges[challenge.id] || false}
              entryFee={challenge.entry_fee}
              onJoin={() => handleJoinChallenge(challenge.id)}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Flex justify="center" p={8}>
          <Text color="gray.500">No active challenges at the moment</Text>
        </Flex>
      )}
    </Box>
  );
} 