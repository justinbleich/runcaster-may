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

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required Supabase environment variables');
  process.exit(1);
}

// Initialize Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Setup weekly challenge templates - you can modify these or add more
const WEEKLY_CHALLENGES = [
  {
    title: 'Monday 5K',
    description: 'Complete a 5 kilometer run this week',
    activity_type: 'run',
    target_value: 5,
    target_unit: 'km',
    entry_fee: 0
  },
  {
    title: 'Weekly Long Run',
    description: 'Run at least 10 kilometers in a single session',
    activity_type: 'run',
    target_value: 10,
    target_unit: 'km',
    entry_fee: 0
  },
  {
    title: 'Cycling Challenge',
    description: 'Cycle at least 50 kilometers this week',
    activity_type: 'bike',
    target_value: 50,
    target_unit: 'km',
    entry_fee: 0
  },
  {
    title: 'Walking Tour',
    description: 'Visit 3 different locations on your walks this week',
    activity_type: 'walk',
    target_value: 3,
    target_unit: 'locations',
    entry_fee: 1 // This one has an entry fee of 1 USDC
  }
];

// Setup viem account and clients for 0xSplits if we have a private key
let account;
let splitsClient;

if (PRIVATE_KEY) {
  account = privateKeyToAccount(PRIVATE_KEY);
  
  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });
  
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  });
  
  splitsClient = new SplitsClient({
    chainId: base.id,
    publicClient,
    signer: walletClient,
  });
} else if (WEEKLY_CHALLENGES.some(challenge => challenge.entry_fee > 0)) {
  console.warn('Warning: Some challenges have entry fees but ADMIN_PRIVATE_KEY is not set.');
  console.warn('Split contracts will not be created automatically.');
}

async function getNextMonday() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToAdd = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7; // If today is Monday, get next Monday, otherwise get nearest upcoming Monday
  
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysToAdd);
  nextMonday.setHours(0, 0, 0, 0); // Start at midnight
  
  return nextMonday;
}

async function createWeeklyChallenges() {
  try {
    const startDate = getNextMonday();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // End Sunday at midnight
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`Creating weekly challenges for week of ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    
    // Create each challenge from our templates
    for (const template of WEEKLY_CHALLENGES) {
      // Add the week to the title
      const weekNumber = Math.ceil((startDate.getDate() - startDate.getDay() + 1) / 7);
      const title = `Week ${weekNumber}: ${template.title}`;
      
      const challenge = {
        ...template,
        title,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true
      };
      
      console.log(`Creating challenge: ${title}`);
      
      const { data, error } = await supabase
        .from('challenges')
        .insert([challenge])
        .select()
        .single();
      
      if (error) {
        console.error(`Failed to create challenge ${title}:`, error);
        continue;
      }
      
      console.log(`Challenge created: ${data.id}`);
      
      // If the challenge has an entry fee and we have the private key, create a split contract
      if (data.entry_fee > 0 && splitsClient && account) {
        try {
          console.log(`Creating split contract for challenge: ${data.id}`);
          
          // Initial recipients - controller gets 100% (will be updated as users complete the challenge)
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
          
          console.log(`Split created with address: ${splitAddress}`);
          
          // Update the challenge with the split address
          const { data: updatedChallenge, error: updateError } = await supabase
            .from('challenges')
            .update({ split_address: splitAddress })
            .eq('id', data.id)
            .select()
            .single();
          
          if (updateError) {
            console.error(`Failed to update challenge with split address:`, updateError);
          } else {
            console.log(`Challenge updated with split address: ${updatedChallenge.id}`);
          }
        } catch (splitError) {
          console.error(`Error creating split for challenge ${data.id}:`, splitError);
        }
      }
    }
    
    console.log('Weekly challenges creation completed');
  } catch (error) {
    console.error('Error creating weekly challenges:', error);
    process.exit(1);
  }
}

createWeeklyChallenges(); 