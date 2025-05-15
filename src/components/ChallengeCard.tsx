import React from 'react';
import { 
  Box, 
  Text, 
  Progress, 
  Flex, 
  Badge, 
  useColorModeValue, 
  Button,
  Avatar,
  AvatarGroup,
  Tag,
  TagLeftIcon,
  TagLabel
} from '@chakra-ui/react';
import { FaUsers, FaCalendarAlt, FaTrophy } from 'react-icons/fa';

interface ChallengeCardProps {
  title: string;
  description: string;
  progress: number;
  participants: number;
  endDate?: string;
  activityType?: 'run' | 'bike' | 'walk';
  isJoined?: boolean;
  onJoin?: () => void;
}

export function ChallengeCard({ 
  title, 
  description, 
  progress, 
  participants, 
  endDate = "This week", 
  activityType,
  isJoined = false,
  onJoin = () => {}
}: ChallengeCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Generate a color scheme based on activity type
  const getColorScheme = () => {
    switch(activityType) {
      case 'run': return 'orange';
      case 'bike': return 'blue';
      case 'walk': return 'green';
      default: return 'purple';
    }
  };
  
  const colorScheme = getColorScheme();
  
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
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontWeight="bold" fontSize="md">{title}</Text>
        <Badge colorScheme={colorScheme} variant="subtle" px={2}>
          {activityType ? activityType.charAt(0).toUpperCase() + activityType.slice(1) : 'Challenge'}
        </Badge>
      </Flex>
      
      <Text fontSize="sm" color="gray.500" mb={4}>
        {description}
      </Text>
      
      <Box mb={4}>
        <Flex justify="space-between" mb={1}>
          <Text fontSize="xs" fontWeight="medium">Progress</Text>
          <Text fontSize="xs" fontWeight="medium">{progress}%</Text>
        </Flex>
        <Progress 
          value={progress} 
          size="sm" 
          borderRadius="full" 
          colorScheme={colorScheme}
        />
      </Box>
      
      <Flex direction="column" gap={2}>
        <Flex align="center" justify="space-between">
          <Tag size="sm" variant="subtle" colorScheme="gray">
            <TagLeftIcon as={FaUsers} />
            <TagLabel>{participants} participants</TagLabel>
          </Tag>
          
          <Tag size="sm" variant="subtle" colorScheme="gray">
            <TagLeftIcon as={FaCalendarAlt} />
            <TagLabel>{endDate}</TagLabel>
          </Tag>
        </Flex>
        
        <Button 
          size="sm" 
          colorScheme={isJoined ? "gray" : colorScheme}
          variant={isJoined ? "outline" : "solid"}
          leftIcon={isJoined ? undefined : <FaTrophy />}
          onClick={onJoin}
          mt={2}
        >
          {isJoined ? "Joined" : "Join Challenge"}
        </Button>
      </Flex>
    </Box>
  );
} 