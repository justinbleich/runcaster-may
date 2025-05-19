import {
  Box,
  Button,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Stack,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Select,
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

// Types
interface Challenge {
  id: string;
  title: string;
  description: string;
  activity_type: string | null;
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date: string;
  entry_fee: number;
  is_active: boolean;
  reward_type?: string;
  created_at: string;
}

interface ChallengeConfig {
  id: number;
  challenge_type: string;
  title: string;
  description: string;
  activity_type: string | null;
  target_value: number;
  target_unit: string;
  duration_days: number;
  pool_amount: number;
}

// Error type for supabase
interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Challenge ranking response
interface RankingResult {
  success: boolean;
  message: string;
  challenge_id: string;
  timestamp: string;
}

export function ChallengeAdmin() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [selectedChallengeType, setSelectedChallengeType] = useState<string>("weekly_distance");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch challenges
  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Challenge[];
    }
  });

  // Fetch challenge configurations
  const { data: challengeConfigs = [] } = useQuery({
    queryKey: ["challenge-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_config")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      return data as ChallengeConfig[];
    }
  });

  // Create a new challenge
  const createChallenge = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc("create_new_challenge", {
        input_challenge_type: selectedChallengeType
      });

      if (error) throw error;

      toast({
        title: "Challenge created",
        description: `New ${selectedChallengeType} challenge has been created.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh challenges list
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
    } catch (error) {
      console.error("Error creating challenge:", error);
      const errorMessage = (error as SupabaseError).message || "Unknown error";
      toast({
        title: "Error",
        description: `Failed to create challenge: ${errorMessage}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Close a challenge and calculate rankings
  const closeChallenge = async () => {
    if (!selectedChallenge) return;
    
    setIsLoading(true);
    try {
      // Update challenge to inactive
      const { error: updateError } = await supabase
        .from("challenges")
        .update({ is_active: false })
        .eq("id", selectedChallenge);

      if (updateError) throw updateError;

      // Calculate rankings
      const { data: rankingData, error: rankError } = await supabase
        .rpc("calculate_challenge_rankings", { 
          challenge_id: selectedChallenge 
        });

      if (rankError) throw rankError;

      const result = rankingData as RankingResult;
      
      toast({
        title: "Challenge closed",
        description: result.message || "Challenge has been closed and rankings calculated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh challenges list
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
    } catch (error) {
      console.error("Error closing challenge:", error);
      const errorMessage = (error as SupabaseError).message || "Unknown error";
      toast({
        title: "Error",
        description: `Failed to close challenge: ${errorMessage}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  // View challenge rankings
  const viewRankings = async (challengeId: string) => {
    try {
      const { data, error } = await supabase
        .from("challenge_rankings")
        .select(`
          id, 
          rank, 
          achievement_value, 
          reward_percentage, 
          reward_amount,
          profiles:fid(username, display_name, pfp_url)
        `)
        .eq("challenge_id", challengeId)
        .order("rank", { ascending: true });

      if (error) throw error;

      console.log("Challenge rankings:", data);
      
      // In a real app, you would show these rankings in a modal
      toast({
        title: "Rankings retrieved",
        description: `Retrieved ${data.length} rankings for challenge.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error viewing rankings:", error);
      const errorMessage = (error as SupabaseError).message || "Unknown error";
      toast({
        title: "Error",
        description: `Failed to view rankings: ${errorMessage}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Check if challenge is active
  const isChallengeActive = (challenge: Challenge) => {
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    return now >= startDate && now <= endDate && challenge.is_active;
  };

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>Challenge Administration</Heading>
      
      {/* Create new challenge */}
      <Box bg="gray.100" borderRadius="md" p={4} mb={8}>
        <Heading size="md" mb={4}>Create New Challenge</Heading>
        
        <Stack direction="row" spacing={4} mb={4}>
          <Select 
            value={selectedChallengeType}
            onChange={(e) => setSelectedChallengeType(e.target.value)}
            width="300px"
          >
            {challengeConfigs.map(config => (
              <option key={config.id} value={config.challenge_type}>
                {config.title}
              </option>
            ))}
          </Select>
          
          <Button 
            colorScheme="green" 
            onClick={createChallenge}
            isLoading={isLoading}
          >
            Create Challenge
          </Button>
        </Stack>
        
        {selectedChallengeType && challengeConfigs.find(c => c.challenge_type === selectedChallengeType) && (
          <Box bg="white" borderRadius="md" p={3}>
            <Text fontWeight="bold">
              {challengeConfigs.find(c => c.challenge_type === selectedChallengeType)?.title}
            </Text>
            <Text fontSize="sm">
              {challengeConfigs.find(c => c.challenge_type === selectedChallengeType)?.description}
            </Text>
            <Flex mt={2}>
              <Text fontSize="xs" color="gray.500" mr={4}>
                Type: {challengeConfigs.find(c => c.challenge_type === selectedChallengeType)?.activity_type || 'Any'}
              </Text>
              <Text fontSize="xs" color="gray.500" mr={4}>
                Duration: {challengeConfigs.find(c => c.challenge_type === selectedChallengeType)?.duration_days} days
              </Text>
              <Text fontSize="xs" color="gray.500">
                Pool: {challengeConfigs.find(c => c.challenge_type === selectedChallengeType)?.pool_amount} units
              </Text>
            </Flex>
          </Box>
        )}
      </Box>
      
      {/* Challenges list */}
      <Heading size="md" mb={4}>Active Challenges</Heading>
      
      {challengesLoading ? (
        <Text>Loading challenges...</Text>
      ) : (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {challenges.length > 0 ? (
              challenges.map(challenge => (
                <Tr key={challenge.id}>
                  <Td fontWeight="medium">{challenge.title}</Td>
                  <Td>{challenge.activity_type || 'Any'}</Td>
                  <Td fontSize="sm">
                    {formatDate(challenge.start_date)} to<br />
                    {formatDate(challenge.end_date)}
                  </Td>
                  <Td>
                    <Badge colorScheme={isChallengeActive(challenge) ? "green" : "gray"}>
                      {isChallengeActive(challenge) ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td>
                    <Stack direction="row" spacing={2}>
                      <Button 
                        size="xs" 
                        onClick={() => viewRankings(challenge.id)}
                        colorScheme="blue"
                      >
                        Rankings
                      </Button>
                      
                      {isChallengeActive(challenge) && (
                        <Button 
                          size="xs" 
                          colorScheme="red"
                          onClick={() => {
                            setSelectedChallenge(challenge.id);
                            onOpen();
                          }}
                        >
                          Close
                        </Button>
                      )}
                    </Stack>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={5} textAlign="center" py={4}>
                  No challenges found
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      )}
      
      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Close Challenge
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to close this challenge? This will calculate final rankings and distribute rewards.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={closeChallenge} 
                ml={3}
                isLoading={isLoading}
              >
                Close Challenge
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
} 