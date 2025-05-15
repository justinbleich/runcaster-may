import { SplitsClient } from '@0xsplits/splits-sdk';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Initialize the Splits client for Base network
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

const splitsClient = new SplitsClient({
  chainId: base.id,
  publicClient,
});

export interface ChallengeReward {
  recipient: `0x${string}`; // Ethereum address
  percentAllocation: number; // 1-100 percentage
}

/**
 * Creates a new Split for a challenge
 * @param challengeId Unique identifier for the challenge
 * @param controller Address that will control the split
 * @param recipients Array of recipients with their percentage allocations
 * @returns The address of the created split
 */
export async function createChallengeSplit(
  challengeId: string,
  controller: `0x${string}`,
  recipients: ChallengeReward[]
) {
  try {
    // Convert percentages to basis points (1% = 100 basis points)
    const recipientsWithBasisPoints = recipients.map(recipient => ({
      address: recipient.recipient,
      percentAllocation: recipient.percentAllocation * 100, // Convert to basis points
    }));

    // Create the split
    const createSplitTxData = await splitsClient.createSplit({
      recipients: recipientsWithBasisPoints,
      distributorFee: 0, // No fee
      controller, // Address that can update the split
    });

    console.log(`Split created for challenge ${challengeId}:`, createSplitTxData);
    return createSplitTxData;
  } catch (error) {
    console.error('Error creating split:', error);
    throw error;
  }
}

/**
 * Updates an existing split with new recipients
 * @param splitAddress The address of the split to update
 * @param controller Address that controls the split
 * @param recipients Array of recipients with their percentage allocations
 */
export async function updateChallengeSplit(
  splitAddress: `0x${string}`,
  controller: `0x${string}`,
  recipients: ChallengeReward[]
) {
  try {
    // Convert percentages to basis points
    const recipientsWithBasisPoints = recipients.map(recipient => ({
      address: recipient.recipient,
      percentAllocation: recipient.percentAllocation * 100,
    }));

    // Update the split
    const updateSplitTxData = await splitsClient.updateSplit({
      splitAddress,
      recipients: recipientsWithBasisPoints,
      distributorFee: 0,
      controller,
    });

    console.log(`Split updated:`, updateSplitTxData);
    return updateSplitTxData;
  } catch (error) {
    console.error('Error updating split:', error);
    throw error;
  }
}

/**
 * Gets the transaction data for a user to fund a challenge
 * @param splitAddress The address of the split to fund
 * @param tokenAddress The address of the token to send (USDC)
 * @returns Transaction data for funding
 */
export function getFundingTransactionData(
  splitAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  amount: bigint
) {
  return {
    to: tokenAddress,
    data: splitsClient.getTransferToSplitTxData({
      splitAddress,
      tokenAddress,
      amount,
    }),
  };
}

/**
 * Gets the balance of a split
 * @param splitAddress The address of the split
 * @param tokenAddress The address of the token (USDC)
 * @returns The balance of the split
 */
export async function getSplitBalance(
  splitAddress: `0x${string}`,
  tokenAddress: `0x${string}`
) {
  try {
    const balance = await splitsClient.getBalances({
      splitAddress,
      tokens: [tokenAddress],
    });
    
    return balance;
  } catch (error) {
    console.error('Error getting split balance:', error);
    throw error;
  }
}

/**
 * Distributes funds from a split to its recipients
 * @param splitAddress The address of the split
 * @param tokenAddresses Array of token addresses to distribute
 * @returns Transaction data for distribution
 */
export async function distributeChallengeFunds(
  splitAddress: `0x${string}`,
  tokenAddresses: `0x${string}`[]
) {
  try {
    const distributeTxData = await splitsClient.distributeToken({
      splitAddress,
      token: tokenAddresses[0], // Assuming USDC is the first token
    });
    
    return distributeTxData;
  } catch (error) {
    console.error('Error distributing funds:', error);
    throw error;
  }
} 