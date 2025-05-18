import { useState } from 'react';
import { 
  Box, 
  Heading, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td,
  Avatar,
  Text,
  Flex,
  Badge,
  ButtonGroup,
  Button,
  useColorModeValue,
  Spinner
} from '@chakra-ui/react';
import { Activity } from '../lib/supabase';
import { sdk } from '@farcaster/frame-sdk';

interface LeaderboardEntry {
  fid: number;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  total: number;
  unit: string;
  activityCount: number;
}

interface LeaderboardSectionProps {
  isLoading: boolean;
  profileMap: Record<number, any>;
  activities: Activity[];
}

export function LeaderboardSection({ isLoading, profileMap, activities }: LeaderboardSectionProps) {
  const [metric, setMetric] = useState<'distance' | 'count' | 'pace'>('distance');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Calculate leaderboard entries based on the selected metric
  const calculateLeaderboard = (): LeaderboardEntry[] => {
    const userActivityMap: Record<number, { 
      fid: number,
      totalDistance: number, 
      activityCount: number,
      totalDuration: number
    }> = {};
    
    // Group activities by user
    activities.forEach(activity => {
      if (!userActivityMap[activity.fid]) {
        userActivityMap[activity.fid] = {
          fid: activity.fid,
          totalDistance: 0,
          activityCount: 0,
          totalDuration: 0
        };
      }
      
      userActivityMap[activity.fid].totalDistance += activity.distance;
      userActivityMap[activity.fid].activityCount += 1;
      userActivityMap[activity.fid].totalDuration += activity.duration;
    });
    
    // Convert to array and sort based on selected metric
    const entries = Object.values(userActivityMap);
    
    let sortedEntries;
    if (metric === 'distance') {
      sortedEntries = entries.sort((a, b) => b.totalDistance - a.totalDistance);
      return sortedEntries.slice(0, 5).map(entry => ({
        fid: entry.fid,
        username: profileMap[entry.fid]?.username,
        displayName: profileMap[entry.fid]?.display_name,
        avatarUrl: profileMap[entry.fid]?.pfp_url,
        total: parseFloat(entry.totalDistance.toFixed(1)),
        unit: 'km',
        activityCount: entry.activityCount
      }));
    } else if (metric === 'count') {
      sortedEntries = entries.sort((a, b) => b.activityCount - a.activityCount);
      return sortedEntries.slice(0, 5).map(entry => ({
        fid: entry.fid,
        username: profileMap[entry.fid]?.username,
        displayName: profileMap[entry.fid]?.display_name,
        avatarUrl: profileMap[entry.fid]?.pfp_url,
        total: entry.activityCount,
        unit: 'activities',
        activityCount: entry.activityCount
      }));
    } else { // pace - average speed
      sortedEntries = entries
        .filter(entry => entry.totalDistance > 0) // Avoid division by zero
        .sort((a, b) => {
          const paceA = a.totalDistance / (a.totalDuration / 60); // km/h
          const paceB = b.totalDistance / (b.totalDuration / 60); // km/h
          return paceB - paceA; // Highest speed first
        });
      
      return sortedEntries.slice(0, 5).map(entry => {
        const avgSpeed = entry.totalDistance / (entry.totalDuration / 60);
        return {
          fid: entry.fid,
          username: profileMap[entry.fid]?.username,
          displayName: profileMap[entry.fid]?.display_name,
          avatarUrl: profileMap[entry.fid]?.pfp_url,
          total: parseFloat(avgSpeed.toFixed(1)),
          unit: 'km/h',
          activityCount: entry.activityCount
        };
      });
    }
  };
  
  const leaderboard = calculateLeaderboard();
  
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
      <Heading size="md" mb={4}>Leaderboard</Heading>
      
      <ButtonGroup size="sm" isAttached variant="outline" mb={4} width="100%">
        <Button 
          onClick={() => setMetric('distance')}
          colorScheme={metric === 'distance' ? 'orange' : 'gray'}
          fontWeight={metric === 'distance' ? 'bold' : 'normal'}
          flex="1"
        >
          Distance
        </Button>
        <Button 
          onClick={() => setMetric('count')}
          colorScheme={metric === 'count' ? 'orange' : 'gray'}
          fontWeight={metric === 'count' ? 'bold' : 'normal'}
          flex="1"
        >
          Count
        </Button>
        <Button 
          onClick={() => setMetric('pace')}
          colorScheme={metric === 'pace' ? 'orange' : 'gray'}
          fontWeight={metric === 'pace' ? 'bold' : 'normal'}
          flex="1"
        >
          Speed
        </Button>
      </ButtonGroup>
      
      {isLoading ? (
        <Flex justify="center" p={8}>
          <Spinner />
        </Flex>
      ) : (
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th width="50px">Rank</Th>
              <Th>User</Th>
              <Th isNumeric>
                {metric === 'distance' ? 'Total Distance' : 
                 metric === 'count' ? 'Activities' : 'Avg Speed'}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {leaderboard.map((entry, index) => (
              <Tr key={entry.fid} cursor="pointer" _hover={{ bg: 'gray.50' }} onClick={() => handleProfileClick(entry.fid)}>
                <Td fontWeight="bold">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1)}
                </Td>
                <Td>
                  <Flex align="center">
                    <Avatar 
                      size="sm" 
                      src={entry.avatarUrl} 
                      name={entry.displayName || entry.username || `User ${entry.fid}`} 
                      mr={2}
                    />
                    <Box>
                      <Text fontWeight="medium">
                        {entry.displayName || entry.username || `User ${entry.fid}`}
                      </Text>
                      {entry.username && (
                        <Text fontSize="xs" color="gray.500">@{entry.username}</Text>
                      )}
                    </Box>
                  </Flex>
                </Td>
                <Td isNumeric>
                  <Badge colorScheme="orange" fontSize="sm">
                    {entry.total} {entry.unit}
                  </Badge>
                </Td>
              </Tr>
            ))}
            {leaderboard.length === 0 && (
              <Tr>
                <Td colSpan={3} textAlign="center" py={4}>
                  <Text color="gray.500">No data available</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      )}
    </Box>
  );
} 