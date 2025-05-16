import { execSync } from 'child_process';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🏃‍♀️ Runcaster Challenge Automation Testing 🏃‍♂️');
  console.log('================================================');
  
  // Check if environment variables are set
  const missingVars = [];
  if (!process.env.VITE_SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_KEY) missingVars.push('SUPABASE_SERVICE_KEY');
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please set these in your .env file before continuing.');
    process.exit(1);
  }
  
  // Check if ADMIN_PRIVATE_KEY is set for splits functionality
  if (!process.env.ADMIN_PRIVATE_KEY) {
    console.warn('⚠️ ADMIN_PRIVATE_KEY is not set. Split contract creation and distribution will be skipped.');
  }
  
  // Show menu
  console.log('\nSelect an option:');
  console.log('1. Create weekly challenges for next week');
  console.log('2. Distribute rewards for completed challenges');
  console.log('3. Create a single challenge now');
  console.log('4. Exit');
  
  const option = await askQuestion('\nEnter option (1-4): ');
  
  switch (option) {
    case '1':
      console.log('\n📅 Creating weekly challenges...');
      try {
        execSync('node src/scripts/create-weekly-challenge.js', { stdio: 'inherit' });
        console.log('✅ Weekly challenges created successfully!');
      } catch (error) {
        console.error('❌ Error creating weekly challenges.');
      }
      break;
      
    case '2':
      console.log('\n🏆 Distributing rewards for completed challenges...');
      if (!process.env.ADMIN_PRIVATE_KEY) {
        console.error('❌ ADMIN_PRIVATE_KEY is required for reward distribution.');
        break;
      }
      try {
        execSync('node src/scripts/distribute-weekly-rewards.js', { stdio: 'inherit' });
        console.log('✅ Rewards distributed successfully!');
      } catch (error) {
        console.error('❌ Error distributing rewards.');
      }
      break;
      
    case '3':
      console.log('\n🏃 Create a single challenge');
      const title = await askQuestion('Enter challenge title: ');
      const description = await askQuestion('Enter challenge description: ');
      const activityType = await askQuestion('Enter activity type (run, bike, walk, or null): ');
      const targetValue = await askQuestion('Enter target value (e.g., 5): ');
      const targetUnit = await askQuestion('Enter target unit (km, count, or locations): ');
      const entryFee = await askQuestion('Enter entry fee in USDC (0 for free challenges): ');
      
      try {
        execSync(
          `node src/scripts/create-new-challenge.js "${title}" "${description}" ${activityType} ${targetValue} ${targetUnit} ${entryFee}`,
          { stdio: 'inherit' }
        );
        console.log('✅ Challenge created successfully!');
      } catch (error) {
        console.error('❌ Error creating challenge.');
      }
      break;
      
    case '4':
      console.log('\nExiting...');
      break;
      
    default:
      console.log('\nInvalid option. Exiting...');
  }
  
  rl.close();
}

main(); 