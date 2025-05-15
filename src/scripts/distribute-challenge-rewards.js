import { createClient } from '@supabase/supabase-js';
import { SplitsClient } from '@0xsplits/splits-sdk';
import { createPublicClient, http, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const CHALLENGE_ID = process.argv[2]; // Pass challenge ID as argument
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PRIVATE_KEY || !CHALLENGE_ID) {
  console.error('Missing required environment variables or challenge ID');
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

async function main() {
  try {
    // Get challenge data
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', CHALLENGE_ID)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch challenge: ${error.message}`);
    }
    
    if (!challenge) {
      throw new Error(`Challenge not found with ID: ${CHALLENGE_ID}`);
    }
    
    if (!challenge.split_address) {
      throw new Error(`Challenge does not have a split address`);
    }
    
    console.log('Distributing rewards for challenge:', challenge.title);
    
    // Get challenge participants who have paid
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', CHALLENGE_ID)
      .eq('has_paid', true)
      .order('current_progress', { ascending: false });
    
    if (participantsError) {
      throw new Error(`Failed to fetch participants: ${participantsError.message}`);
    }
    
    if (!participants || participants.length === 0) {
      throw new Error(`No paid participants found for challenge`);
    }
    
    console.log(`Found ${participants.length} paid participants`);
    
    // Calculate rewards based on progress
    // For simplicity, we'll use a tiered approach:
    // - Top 10% get 50% of the pool
    // - Next 20% get 30% of the pool
    // - Everyone else shares 20% of the pool
    
    const topCount = Math.max(1, Math.ceil(participants.length * 0.1)); // At least 1
    const secondTierCount = Math.max(1, Math.ceil(participants.length * 0.2)); // At least 1
    
    // Group participants by tier
    const topTier = participants.slice(0, topCount);
    const secondTier = participants.slice(topCount, topCount + secondTierCount);
    const rest = participants.slice(topCount + secondTierCount);
    
    // Calculate allocations for each participant
    const recipientAllocations = [];
    
    // Top tier (share 50% equally)
    const topTierAllocation = topTier.length > 0 ? Math.floor(5000 / topTier.length) : 0;
    topTier.forEach(participant => {
      recipientAllocations.push({
        address: participant.user_address,
        percentAllocation: topTierAllocation,
      });
    });
    
    // Second tier (share 30% equally)
    const secondTierAllocation = secondTier.length > 0 ? Math.floor(3000 / secondTier.length) : 0;
    secondTier.forEach(participant => {
      recipientAllocations.push({
        address: participant.user_address,
        percentAllocation: secondTierAllocation,
      });
    });
    
    // Rest (share 20% equally)
    const restAllocation = rest.length > 0 ? Math.floor(2000 / rest.length) : 0;
    rest.forEach(participant => {
      recipientAllocations.push({
        address: participant.user_address,
        percentAllocation: restAllocation,
      });
    });
    
    console.log('Recipient allocations:', recipientAllocations);
    
    // Update the split with new allocations
    const updateSplitTxData = await splitsClient.updateSplit({
      splitAddress: challenge.split_address,
      recipients: recipientAllocations,
      distributorFee: 0,
      controller: account.address,
    });
    
    console.log('Split updated with new allocations:', updateSplitTxData);
    
    // Distribute USDC tokens to recipients
    const distributeTxData = await splitsClient.distributeToken({
      splitAddress: challenge.split_address,
      token: USDC_ADDRESS,
    });
    
    console.log('Rewards distributed:', distributeTxData);
    
    // Update challenge to inactive
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('challenges')
      .update({ is_active: false })
      .eq('id', CHALLENGE_ID)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to update challenge: ${updateError.message}`);
    }
    
    console.log('Challenge marked as inactive:', updatedChallenge);
    
    console.log('✅ Reward distribution successful!');
  } catch (error) {
    console.error('Error distributing rewards:', error);
    process.exit(1);
  }
}

main(); 