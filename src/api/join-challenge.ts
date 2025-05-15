import { NextRequest, NextResponse } from 'next/server';
import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit/frame';
import { getChallengeById } from '../lib/challenges';
import { getFundingTransactionData } from '../lib/splits';

// USDC address on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse request from Farcaster Frame
    const body: FrameRequest = await req.json();
    const { isValid, message } = await getFrameMessage(body, {
      neynarApiKey: 'NEYNAR_ONCHAIN_KIT', // Replace with your Neynar API key
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid frame request' },
        { status: 400 }
      );
    }

    // Get challenge ID from query params
    const url = new URL(req.url);
    const challengeId = url.searchParams.get('id');
    
    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // Get the challenge data
    const challenge = await getChallengeById(challengeId);
    
    if (!challenge || !challenge.split_address) {
      return NextResponse.json(
        { error: 'Challenge not found or split address not configured' },
        { status: 404 }
      );
    }

    // 1 USDC with 6 decimals
    const amount = BigInt(1_000_000);
    
    // Get transaction data for funding the split
    const txData = getFundingTransactionData(
      challenge.split_address as `0x${string}`,
      USDC_ADDRESS as `0x${string}`,
      amount
    );

    // Return the transaction data for the Frame to execute
    return NextResponse.json({
      chainId: 'eip155:8453', // Base mainnet
      method: 'eth_sendTransaction',
      params: {
        to: USDC_ADDRESS,
        data: txData.data,
        value: '0x0', // No ETH value, just the token transfer
      },
    });
  } catch (error) {
    console.error('Error processing join challenge request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ message: 'Use POST for frame transactions' });
} 