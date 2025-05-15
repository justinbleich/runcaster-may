import { useState, useMemo } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Flex,
  Button,
  useColorModeValue,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { useQuery } from "@tanstack/react-query";
import { getActivities, Activity } from '../lib/supabase';
import { ChallengeCard } from './ChallengeCard';

interface ChallengesSectionProps {
  userFid?: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  participants: number;
  activityType: 'run' | 'bike' | 'walk';
  endDate: string;
  targetValue: number;
  currentValue: number;
}

export function ChallengesSection({ userFid }: ChallengesSectionProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();
  
  // Fetch activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['all-activities'],
    queryFn: getActivities
  });
  
  // In a real app, this would track joined challenges in the database
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>([]);
  
  // Generate dynamic challenges based on real activity data
  const challenges = useMemo(() => {
    if (isLoading) return [];
    
    const allActivities = activities as Activity[];
    
    // Get current user's activities if logged in
    const userActivities = userFid 
      ? allActivities.filter(a => a.fid === userFid)
      : [];
    
    // Calculate total distances by type
    const totalRunDistance = allActivities
      .filter(a => a.type === 'run')
      .reduce((sum, a) => sum + a.distance, 0);
      
    const totalBikeDistance = allActivities
      .filter(a => a.type === 'bike')
      .reduce((sum, a) => sum + a.distance, 0);
      
    const totalWalkDistance = allActivities
      .filter(a => a.type === 'walk')
      .reduce((sum, a) => sum + a.distance, 0);
    
    // Count unique locations
    const uniqueLocations = new Set(allActivities.map(a => a.location).filter(Boolean)).size;
    
    // Count participants by activity type
    const runParticipants = new Set(allActivities.filter(a => a.type === 'run').map(a => a.fid)).size;
    const bikeParticipants = new Set(allActivities.filter(a => a.type === 'bike').map(a => a.fid)).size;
    const walkParticipants = new Set(allActivities.filter(a => a.type === 'walk').map(a => a.fid)).size;
    
    // Calculate user progress for each challenge
    const calculateUserProgress = (type: 'run' | 'bike' | 'walk', target: number): number => {
      if (!userFid) return 0;
      
      const userDistanceByType = userActivities
        .filter(a => a.type === type)
        .reduce((sum, a) => sum + a.distance, 0);
        
      return Math.min(Math.floor((userDistanceByType / target) * 100), 100);
    };
    
    // Get user's unique locations
    const userUniqueLocations = new Set(
      userActivities.map(a => a.location).filter(Boolean)
    ).size;
    
    // Check if user has morning activities
    const userMorningActivities = userActivities.filter(a => {
      const activityDate = new Date(a.created_at);
      const hour = activityDate.getHours();
      return hour < 8; // Before 8am
    }).length;
    
    // Create dynamic challenges
    const dynamicChallenges: Challenge[] = [
      {
        id: 'challenge-run',
        title: 'Weekly Runner',
        description: `Complete 20km of running this week`,
        progress: calculateUserProgress('run', 20),
        participants: runParticipants,
        activityType: 'run',
        endDate: 'This week',
        targetValue: 20,
        currentValue: userFid ? userActivities.filter(a => a.type === 'run').reduce((sum, a) => sum + a.distance, 0) : 0
      },
      {
        id: 'challenge-bike',
        title: 'Century Ride',
        description: `Cycle 100km total distance`,
        progress: calculateUserProgress('bike', 100),
        participants: bikeParticipants,
        activityType: 'bike',
        endDate: '2 weeks left',
        targetValue: 100,
        currentValue: userFid ? userActivities.filter(a => a.type === 'bike').reduce((sum, a) => sum + a.distance, 0) : 0
      },
      {
        id: 'challenge-walk',
        title: 'Step Explorer',
        description: `Walk in ${Math.min(5, uniqueLocations)} different locations`,
        progress: userFid ? Math.min(Math.floor((userUniqueLocations / 5) * 100), 100) : 0,
        participants: walkParticipants,
        activityType: 'walk',
        endDate: '5 days left',
        targetValue: 5,
        currentValue: userUniqueLocations
      },
      {
        id: 'challenge-morning',
        title: 'Early Bird',
        description: 'Complete 3 activities before 8am',
        progress: userFid ? Math.min(Math.floor((userMorningActivities / 3) * 100), 100) : 0,
        participants: Math.floor(Math.random() * 10) + 10, // Random number for variety
        activityType: 'run',
        endDate: '1 week left',
        targetValue: 3,
        currentValue: userMorningActivities
      }
    ];
    
    return dynamicChallenges;
  }, [activities, userFid, isLoading]);
  
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
    
    // If already joined, this would remove the user
    if (joinedChallenges.includes(challengeId)) {
      setJoinedChallenges(prev => prev.filter(id => id !== challengeId));
      toast({
        title: 'Left challenge',
        description: 'You have left the challenge',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Add to joined challenges
      setJoinedChallenges(prev => [...prev, challengeId]);
      toast({
        title: 'Challenge joined!',
        description: 'You have successfully joined the challenge',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
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
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          {challenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              title={challenge.title}
              description={challenge.description}
              progress={challenge.progress}
              participants={challenge.participants}
              endDate={challenge.endDate}
              activityType={challenge.activityType}
              isJoined={joinedChallenges.includes(challenge.id)}
              onJoin={() => handleJoinChallenge(challenge.id)}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
} 