declare module '@0xsplits/splits-sdk' {
  export class SplitsClient {
    constructor(options: { chainId: number; publicClient: any; signer?: any });

    createSplit(options: {
      recipients: Array<{ address: string; percentAllocation: number }>;
      distributorFee: number;
      controller: string;
    }): Promise<string>;

    updateSplit(options: {
      splitAddress: string;
      recipients: Array<{ address: string; percentAllocation: number }>;
      distributorFee: number;
      controller: string;
    }): Promise<any>;

    getTransferToSplitTxData(options: {
      splitAddress: string;
      tokenAddress: string;
      amount: bigint;
    }): string;

    getBalances(options: {
      splitAddress: string;
      tokens: string[];
    }): Promise<any>;

    distributeToken(options: {
      splitAddress: string;
      token: string;
    }): Promise<any>;
  }
} 