/**
 * This script creates a new challenge in the database
 * Run with: node scripts/create-challenge.mjs
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createChallenge() {
  // Create a challenge that starts today and ends in 7 days
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  const challenge = {
    id: uuidv4(), // Generate a new UUID
    title: 'Weekly Run Challenge',
    description: 'Run at least 20km this week to complete the challenge and get rewards!',
    activity_type: 'run',
    target_value: 20,
    target_unit: 'km',
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    entry_fee: 0, // Free for now
    is_active: true
  };

  console.log('Creating challenge:', challenge);

  const { data, error } = await supabase
    .from('challenges')
    .insert([challenge])
    .select();

  if (error) {
    console.error('Error creating challenge:', error);
    return;
  }
  
  console.log('Challenge created successfully:', data);
}

// Run the function
createChallenge()
  .then(() => {
    console.log('Completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  }); 