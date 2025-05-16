import { createClient } from '@supabase/supabase-js';
import { SplitsClient } from '@0xsplits/splits-sdk';
import { createPublicClient, http, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PRIVATE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Initialize Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Setup viem account and clients
const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

// Initialize Splits client
const splitsClient = new SplitsClient({
  chainId: base.id,
  publicClient,
  signer: walletClient,
});

async function getCompletedChallenges() {
  const now = new Date();
  
  // Get challenges that ended in the past 24 hours
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  const { data: completedChallenges, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .lt('end_date', now.toISOString())
    .gte('end_date', yesterday.toISOString())
    .not('split_address', 'is', null);
  
  if (error) {
    console.error('Error getting completed challenges:', error);
    throw error;
  }
  
  return completedChallenges;
}

async function getParticipantsForChallenge(challengeId) {
  const { data: participants, error } = await supabase
    .from('challenge_participants')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('has_paid', true)
    .order('current_progress', { ascending: false });
  
  if (error) {
    console.error(`Error getting participants for challenge ${challengeId}:`, error);
    throw error;
  }
  
  return participants;
}

async function distributeRewards() {
  try {
    const completedChallenges = await getCompletedChallenges();
    
    console.log(`Found ${completedChallenges.length} completed challenges to distribute rewards for`);
    
    for (const challenge of completedChallenges) {
      console.log(`Processing challenge: ${challenge.title} (${challenge.id})`);
      
      // Get participants for this challenge
      const participants = await getParticipantsForChallenge(challenge.id);
      
      if (participants.length === 0) {
        console.log(`No paid participants found for challenge ${challenge.id}, skipping distribution`);
        
        // Mark challenge as inactive 
        await supabase
          .from('challenges')
          .update({ is_active: false })
          .eq('id', challenge.id);
          
        continue;
      }
      
      console.log(`Found ${participants.length} paid participants`);
      
      // Calculate allocations based on performance
      // Top 10% get 50% of the pool, next 20% get 30%, rest share 20%
      const topCount = Math.max(1, Math.ceil(participants.length * 0.1)); 
      const secondTierCount = Math.max(1, Math.ceil(participants.length * 0.2));
      
      // Group participants by tier
      const topTier = participants.slice(0, topCount);
      const secondTier = participants.slice(topCount, topCount + secondTierCount);
      const rest = participants.slice(topCount + secondTierCount);
      
      // Calculate allocations
      const recipientAllocations = [];
      
      // Top tier (50% of pool)
      const topTierAllocation = topTier.length > 0 ? Math.floor(5000 / topTier.length) : 0;
      topTier.forEach(participant => {
        recipientAllocations.push({
          address: participant.user_address,
          percentAllocation: topTierAllocation,
        });
      });
      
      // Second tier (30% of pool)
      const secondTierAllocation = secondTier.length > 0 ? Math.floor(3000 / secondTier.length) : 0;
      secondTier.forEach(participant => {
        recipientAllocations.push({
          address: participant.user_address,
          percentAllocation: secondTierAllocation,
        });
      });
      
      // Rest (20% of pool)
      const restAllocation = rest.length > 0 ? Math.floor(2000 / rest.length) : 0;
      rest.forEach(participant => {
        recipientAllocations.push({
          address: participant.user_address,
          percentAllocation: restAllocation,
        });
      });
      
      console.log(`Created ${recipientAllocations.length} recipient allocations`);
      
      try {
        // Update the split with new allocations
        console.log(`Updating split ${challenge.split_address} with new allocations`);
        await splitsClient.updateSplit({
          splitAddress: challenge.split_address,
          recipients: recipientAllocations,
          distributorFee: 0,
          controller: account.address,
        });
        
        // Distribute USDC tokens to recipients
        console.log(`Distributing USDC from split ${challenge.split_address}`);
        await splitsClient.distributeToken({
          splitAddress: challenge.split_address,
          token: USDC_ADDRESS,
        });
        
        // Mark challenge as inactive
        await supabase
          .from('challenges')
          .update({ is_active: false })
          .eq('id', challenge.id);
          
        console.log(`Successfully distributed rewards and marked challenge ${challenge.id} as inactive`);
      } catch (error) {
        console.error(`Error distributing rewards for challenge ${challenge.id}:`, error);
      }
    }
    
    console.log('Weekly reward distribution completed');
  } catch (error) {
    console.error('Error distributing rewards:', error);
    process.exit(1);
  }
}

distributeRewards(); 