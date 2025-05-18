/**
 * This script creates a new challenge in the database
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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
    id: '6648f5cc-2421-4665-a799-8738696e0402', // Use pre-generated UUID
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