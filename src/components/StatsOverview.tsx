import React, { useMemo } from 'react';
import { 
  Box, 
  SimpleGrid, 
  Heading, 
  Flex, 
  useColorModeValue 
} from '@chakra-ui/react';
import { FaRunning, FaBiking, FaWalking, FaUsers, FaRoute, FaMapMarkerAlt, FaCalendarCheck } from 'react-icons/fa';
import { StatCard } from './StatCard';
import { Activity } from '../lib/supabase';

interface StatsOverviewProps {
  activities: Activity[];
  isLoading: boolean;
}

export function StatsOverview({ activities, isLoading }: StatsOverviewProps) {
  const bgGradient = useColorModeValue(
    'linear(to-r, orange.400, pink.400)',
    'linear(to-r, orange.600, pink.600)'
  );
  
  // Calculate community stats
  const stats = useMemo(() => {
    if (isLoading) {
      return {
        activitiesCount: 0,
        totalDistance: 0,
        activeUsers: 0,
        topLocation: '',
        runCount: 0,
        bikeCount: 0,
        walkCount: 0,
      };
    }
    
    // Unique active users
    const uniqueUsers = new Set(activities.map(a => a.fid)).size;
    
    // Total distance
    const totalDistance = activities.reduce((acc, curr) => acc + curr.distance, 0);
    
    // Activity types count
    const runCount = activities.filter(a => a.type === 'run').length;
    const bikeCount = activities.filter(a => a.type === 'bike').length;
    const walkCount = activities.filter(a => a.type === 'walk').length;
    
    // Find top location
    const locationCounts: Record<string, number> = {};
    activities.forEach(activity => {
      if (activity.location) {
        locationCounts[activity.location] = (locationCounts[activity.location] || 0) + 1;
      }
    });
    
    const sortedLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1]);
    
    const topLocation = sortedLocations.length > 0 ? sortedLocations[0][0] : 'Unknown';
    
    // Recent activities (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const recentActivities = activities.filter(a => 
      new Date(a.created_at) > oneDayAgo
    ).length;
    
    return {
      activitiesCount: activities.length,
      totalDistance: parseFloat(totalDistance.toFixed(1)),
      activeUsers: uniqueUsers,
      topLocation,
      runCount,
      bikeCount,
      walkCount,
      recentActivities
    };
  }, [activities, isLoading]);
  
  return (
    <Box
      p={6}
      borderRadius="lg"
      bgGradient={bgGradient}
      color="white"
      mb={6}
      boxShadow="md"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md" color="white">Community Highlights</Heading>
      </Flex>
      
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <StatCard 
          label="Activities" 
          value={stats.activitiesCount} 
          icon={FaCalendarCheck} 
          colorScheme="white"
        />
        <StatCard 
          label="Total Distance" 
          value={`${stats.totalDistance} km`} 
          icon={FaRoute} 
          colorScheme="white"
        />
        <StatCard 
          label="Active Users" 
          value={stats.activeUsers} 
          icon={FaUsers} 
          colorScheme="white"
        />
        <StatCard 
          label="Top Location" 
          value={stats.topLocation} 
          icon={FaMapMarkerAlt} 
          colorScheme="white"
        />
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 3 }} spacing={4} mt={4}>
        <StatCard 
          label="Runs" 
          value={stats.runCount} 
          icon={FaRunning} 
          colorScheme="white"
        />
        <StatCard 
          label="Bike Rides" 
          value={stats.bikeCount} 
          icon={FaBiking} 
          colorScheme="white"
        />
        <StatCard 
          label="Walks" 
          value={stats.walkCount} 
          icon={FaWalking} 
          colorScheme="white"
        />
      </SimpleGrid>
    </Box>
  );
} 