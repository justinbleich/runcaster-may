import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Initialize Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get command line arguments for challenge details
const [,, title, description, activityType, targetValue, targetUnit, entryFee] = process.argv;

if (!title || !description || !targetValue || !targetUnit) {
  console.error(`
Usage: node create-new-challenge.js "Challenge Title" "Challenge Description" activityType targetValue targetUnit entryFee
  
Example: node create-new-challenge.js "Weekly 5K" "Run 5 kilometers this week" run 5 km 1
  
Parameters:
  - title: The challenge title
  - description: The challenge description
  - activityType: run, bike, walk, or null for any type
  - targetValue: Numeric target (e.g., 5)
  - targetUnit: km, count, or locations
  - entryFee: USDC amount (optional, default 0)
  `);
  process.exit(1);
}

async function createChallenge() {
  try {
    // Calculate start and end dates (current week)
    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 7); // One week challenge
    
    const challenge = {
      title,
      description,
      activity_type: activityType === 'null' ? null : activityType,
      target_value: parseFloat(targetValue),
      target_unit: targetUnit,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      entry_fee: parseFloat(entryFee || '0'),
      is_active: true
    };
    
    console.log('Creating challenge:', challenge);
    
    const { data, error } = await supabase
      .from('challenges')
      .insert([challenge])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create challenge: ${error.message}`);
    }
    
    console.log('✅ Challenge created successfully!');
    console.log(data);
    
    if (parseFloat(entryFee || '0') > 0) {
      console.log('\nNote: This challenge has an entry fee.');
      console.log('To set up the split contract, run:');
      console.log(`node src/scripts/create-challenge-split.js ${data.id}`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createChallenge(); 