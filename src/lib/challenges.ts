import { supabase } from './supabase';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  activity_type: 'run' | 'bike' | 'walk' | null;
  target_value: number;
  target_unit: 'km' | 'count' | 'locations';
  start_date: string;
  end_date: string;
  entry_fee: number; // In USDC
  split_address?: string; // 0xSplits contract address
  is_active: boolean;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  fid: number;
  user_address: string;
  joined_at: string;
  current_progress: number;
  has_paid: boolean;
  transaction_hash?: string;
}

/**
 * Creates a new challenge
 */
export async function createChallenge(challenge: Omit<Challenge, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('challenges')
    .insert([challenge])
    .select()
    .single();

  if (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
  
  return data as Challenge;
}

/**
 * Updates a challenge with a split address
 */
export async function updateChallengeSplitAddress(challengeId: string, splitAddress: string) {
  const { data, error } = await supabase
    .from('challenges')
    .update({ split_address: splitAddress })
    .eq('id', challengeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating challenge split address:', error);
    throw error;
  }
  
  return data as Challenge;
}

/**
 * Gets all active challenges
 */
export async function getActiveChallenges() {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting active challenges:', error);
    throw error;
  }
  
  return data as Challenge[];
}

/**
 * Gets a challenge by ID
 */
export async function getChallengeById(challengeId: string) {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (error) {
    console.error('Error getting challenge:', error);
    throw error;
  }
  
  return data as Challenge;
}

/**
 * Joins a user to a challenge
 */
export async function joinChallenge(
  challengeId: string,
  fid: number,
  userAddress: string,
  transactionHash?: string
) {
  const participant: Omit<ChallengeParticipant, 'id' | 'joined_at'> = {
    challenge_id: challengeId,
    fid,
    user_address: userAddress,
    current_progress: 0,
    has_paid: !!transactionHash,
    transaction_hash: transactionHash
  };

  const { data, error } = await supabase
    .from('challenge_participants')
    .insert([participant])
    .select()
    .single();

  if (error) {
    console.error('Error joining challenge:', error);
    throw error;
  }
  
  return data as ChallengeParticipant;
}

/**
 * Updates a participant's payment status
 */
export async function updateParticipantPayment(
  participantId: string,
  transactionHash: string
) {
  const { data, error } = await supabase
    .from('challenge_participants')
    .update({ 
      has_paid: true,
      transaction_hash: transactionHash
    })
    .eq('id', participantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating participant payment:', error);
    throw error;
  }
  
  return data as ChallengeParticipant;
}

/**
 * Updates a participant's progress
 */
export async function updateParticipantProgress(
  participantId: string,
  progress: number
) {
  const { data, error } = await supabase
    .from('challenge_participants')
    .update({ current_progress: progress })
    .eq('id', participantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating participant progress:', error);
    throw error;
  }
  
  return data as ChallengeParticipant;
}

/**
 * Gets all participants for a challenge
 */
export async function getChallengeParticipants(challengeId: string) {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('*')
    .eq('challenge_id', challengeId);

  if (error) {
    console.error('Error getting challenge participants:', error);
    throw error;
  }
  
  return data as ChallengeParticipant[];
}

/**
 * Gets a user's challenges
 */
export async function getUserChallenges(fid: number) {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select(`
      *,
      challenges:challenge_id (*)
    `)
    .eq('fid', fid);

  if (error) {
    console.error('Error getting user challenges:', error);
    throw error;
  }
  
  return data;
}

/**
 * Checks if a user has joined a challenge
 */
export async function hasJoinedChallenge(challengeId: string, fid: number) {
  const { count, error } = await supabase
    .from('challenge_participants')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challengeId)
    .eq('fid', fid);

  if (error) {
    console.error('Error checking if user has joined challenge:', error);
    throw error;
  }
  
  return (count || 0) > 0;
} 