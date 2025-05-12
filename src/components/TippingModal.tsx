import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  useToast,
  VStack,
  HStack,
  Image,
} from "@chakra-ui/react";
import { useAccount, useContractWrite, useBalance } from "wagmi";
import { parseUnits } from "viem";
import { useState } from "react";

// USDC contract address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;
const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface TippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientAddress: string;
  activityTitle?: string;
}

export function TippingModal({ isOpen, onClose, recipientAddress, activityTitle }: TippingModalProps) {
  const { address } = useAccount();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check USDC balance
  const { data: balance } = useBalance({
    address,
    token: USDC_ADDRESS,
  });

  const { writeContract } = useContractWrite();

  const handleTip = async () => {
    if (!writeContract || !address) return;
    
    // Prevent tipping yourself
    if (address.toLowerCase() === recipientAddress.toLowerCase()) {
      toast({
        title: "Cannot tip yourself",
        description: "You cannot send tips to your own activities.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Check if user has enough USDC
    const tipAmount = parseUnits("1", 6); // 1 USDC with 6 decimals
    if (balance && balance.value < tipAmount) {
      toast({
        title: "Insufficient balance",
        description: "You need at least 1 USDC to send a tip.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [recipientAddress as `0x${string}`, tipAmount],
      });
      toast({
        title: "Tip sent!",
        description: "Your tip has been sent successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error sending tip",
        description: error instanceof Error ? error.message : "Failed to send tip",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Send a Tip</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              {activityTitle ? `Tip for "${activityTitle}"` : "Send a tip to support this activity"}
            </Text>
            <HStack justify="center" spacing={2}>
              <Image src="/usdc-logo.png" alt="USDC" boxSize="24px" />
              <Text fontSize="2xl" fontWeight="bold">1 USDC</Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              This will send 1 USDC to the activity creator's wallet.
            </Text>
            {balance && (
              <Text fontSize="sm" color="gray.500">
                Your balance: {Number(balance.formatted).toFixed(2)} USDC
              </Text>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleTip}
            isLoading={isSubmitting}
            loadingText="Sending..."
            isDisabled={!address || address.toLowerCase() === recipientAddress.toLowerCase()}
          >
            Send Tip
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 