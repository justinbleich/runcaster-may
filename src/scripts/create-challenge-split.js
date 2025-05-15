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
    
    console.log('Creating split for challenge:', challenge.title);
    
    // Create initial recipients (this would be updated as the challenge progresses)
    // Initially we just set the controller as the only recipient with 100%
    const recipients = [
      {
        address: account.address,
        percentAllocation: 10000, // 100% in basis points
      }
    ];
    
    // Create the split
    const splitAddress = await splitsClient.createSplit({
      recipients,
      distributorFee: 0, // No fee
      controller: account.address, // Controller can update the split
    });
    
    console.log('Split created with address:', splitAddress);
    
    // Update the challenge with the split address
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('challenges')
      .update({ split_address: splitAddress })
      .eq('id', CHALLENGE_ID)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to update challenge: ${updateError.message}`);
    }
    
    console.log('Challenge updated with split address:', updatedChallenge);
    
    console.log('✅ Split creation successful!');
  } catch (error) {
    console.error('Error creating split:', error);
    process.exit(1);
  }
}

main(); 