import React from 'react';
import { Text } from '@chakra-ui/react';

interface TaggedDescriptionProps {
  description: string;
  mutedColor: string;
}

export function TaggedDescription({ description, mutedColor }: TaggedDescriptionProps) {
  if (!description) return null;
  
  const handleUsernameClick = (username: string) => {
    try {
      // Open user profile in a new tab
      window.open(`https://warpcast.com/${username}`, '_blank');
    } catch (error) {
      console.error('Error opening user profile:', error);
    }
  };
  
  // Match @username patterns
  const parts = description.split(/(@\w+)/g);
  
  return (
    <Text fontSize="sm" color={mutedColor} mb={1}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const username = part.substring(1);
          return (
            <Text 
              as="span" 
              key={i}
              color="blue.500"
              fontWeight="medium"
              cursor="pointer"
              onClick={() => handleUsernameClick(username)}
            >
              {part}
            </Text>
          );
        }
        return <Text as="span" key={i}>{part}</Text>;
      })}
    </Text>
  );
} 