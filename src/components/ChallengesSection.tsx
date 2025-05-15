import { useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Flex,
  Button,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { ChallengeCard } from './ChallengeCard';

interface ChallengesSectionProps {
  userFid?: number;
}

// Sample challenges - in a real app, these would come from a database
const SAMPLE_CHALLENGES = [
  {
    id: 'challenge-1',
    title: 'Century Ride',
    description: 'Complete 100km on bike this week',
    progress: 65,
    participants: 8,
    activityType: 'bike' as const,
    endDate: 'This week'
  },
  {
    id: 'challenge-2',
    title: 'Morning Runner',
    description: 'Complete 3 runs before 8am',
    progress: 33,
    participants: 12,
    activityType: 'run' as const,
    endDate: '2 days left'
  },
  {
    id: 'challenge-3',
    title: 'Explore Your City',
    description: 'Walk in 5 different locations',
    progress: 40,
    participants: 15,
    activityType: 'walk' as const,
    endDate: '5 days left'
  },
  {
    id: 'challenge-4',
    title: 'Spring Marathon',
    description: 'Train for a marathon with this 8-week plan',
    progress: 25,
    participants: 21,
    activityType: 'run' as const,
    endDate: '8 weeks left'
  }
];

export function ChallengesSection({ userFid }: ChallengesSectionProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();
  
  // In a real app, this would track joined challenges in the database
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>([]);
  
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
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        {SAMPLE_CHALLENGES.map(challenge => (
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
    </Box>
  );
} 