declare module '@coinbase/onchainkit/frame' {
  export interface FrameRequest {
    untrustedData: {
      fid: number;
      url: string;
      messageHash: string;
      timestamp: number;
      network: number;
      buttonIndex: number;
      inputText?: string;
      castId: {
        fid: number;
        hash: string;
      };
    };
    trustedData?: {
      messageBytes: string;
    };
  }

  export function getFrameMessage(
    request: FrameRequest,
    options: { neynarApiKey: string }
  ): Promise<{ isValid: boolean; message?: any }>;
} 