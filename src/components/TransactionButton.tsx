import { Button, ButtonProps } from '@chakra-ui/react';
import React from 'react';

interface TransactionButtonProps extends ButtonProps {
  target: string;
  children: React.ReactNode;
}

export function TransactionButton({ 
  target, 
  children, 
  ...props 
}: TransactionButtonProps) {
  const handleClick = () => {
    // Implement your transaction logic here
    // For now, we'll just log the target
    console.log(`Transaction initiated with target: ${target}`);
    // You would typically redirect to the API endpoint or handle the transaction
    window.location.href = target;
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
} 