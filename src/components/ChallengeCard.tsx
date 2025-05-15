import { 
  Box, 
  Text, 
  Progress, 
  Flex, 
  Badge, 
  useColorModeValue, 
  Button,
  Tag,
  TagLeftIcon,
  TagLabel,
  Tooltip
} from '@chakra-ui/react';
import { FaUsers, FaCalendarAlt, FaTrophy, FaCoins } from 'react-icons/fa';

interface ChallengeCardProps {
  id: string;
  title: string;
  description: string;
  progress: number;
  participants: number;
  endDate?: string;
  activityType?: 'run' | 'bike' | 'walk';
  isJoined?: boolean;
  hasPaid?: boolean;
  entryFee?: number;
  onJoin?: () => void;
}

export function ChallengeCard({ 
  id,
  title, 
  description, 
  progress, 
  participants, 
  endDate = "This week", 
  activityType,
  isJoined = false,
  hasPaid = false,
  entryFee = 0,
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
        
        {entryFee > 0 && (
          <Tag size="sm" variant="subtle" colorScheme="yellow" mb={2}>
            <TagLeftIcon as={FaCoins} />
            <TagLabel>{entryFee} USDC Entry Fee</TagLabel>
          </Tag>
        )}
        
        {isJoined ? (
          hasPaid ? (
            <Button 
              size="sm" 
              colorScheme="gray"
              variant="outline"
              leftIcon={<FaTrophy />}
              isDisabled
            >
              Participating
            </Button>
          ) : (
            <Tooltip label="Pay 1 USDC to join this challenge">
              <Button.Transaction
                size="sm"
                colorScheme={colorScheme}
                variant="solid"
                leftIcon={<FaCoins />}
                target={`/api/join-challenge?id=${id}`}
              >
                Pay 1 USDC to Join
              </Button.Transaction>
            </Tooltip>
          )
        ) : (
          <Button 
            size="sm" 
            colorScheme={colorScheme}
            variant="solid"
            leftIcon={<FaTrophy />}
            onClick={onJoin}
          >
            Join Challenge
          </Button>
        )}
      </Flex>
    </Box>
  );
} 