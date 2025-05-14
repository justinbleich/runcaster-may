import React, { useState, useRef } from 'react';
import { 
  Box, 
  FormControl, 
  FormLabel, 
  Textarea, 
  Flex, 
  Text, 
  Avatar, 
  Tooltip, 
  Icon 
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { sdk } from '@farcaster/frame-sdk';

interface UserTagInputProps {
  value: string;
  onChange: (value: string) => void;
  followingUsers: any[];
  label?: string;
  placeholder?: string;
}

export function UserTagInput({ 
  value, 
  onChange, 
  followingUsers,
  label = "Description",
  placeholder = "Type @ to tag someone you follow"
}: UserTagInputProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle input changes, track @ symbol
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const curPos = e.target.selectionStart || 0;
    setCursorPosition(curPos);
    
    // Check if an @ was just typed
    const textBeforeCursor = newValue.substring(0, curPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtPos !== -1 && !textBeforeCursor.substring(lastAtPos).includes(' ')) {
      setSearchTerm(textBeforeCursor.substring(lastAtPos + 1));
      setShowMenu(true);
    } else {
      setShowMenu(false);
    }
  };

  // Filter following users based on search term
  const filteredUsers = followingUsers
    .filter(user => 
      (user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .slice(0, 5); // Limit to 5 results

  // Handle selecting a user
  const handleSelectUser = (username: string) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtPos !== -1) {
      const newValue = 
        value.substring(0, lastAtPos) + 
        `@${username} ` + 
        value.substring(cursorPosition);
      
      onChange(newValue);
      setShowMenu(false);
      
      // Focus the input and place cursor after the inserted username
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = lastAtPos + username.length + 2; // +2 for @ and space
        setTimeout(() => {
          inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    }
  };

  // Handle when user clicks away
  const handleBlur = () => {
    // Small delay to allow for user selection
    setTimeout(() => setShowMenu(false), 200);
  };

  return (
    <Box position="relative">
      <FormControl>
        <Flex alignItems="center">
          <FormLabel fontSize="sm" mb={0}>{label}</FormLabel>
          <Tooltip label="Type @ to tag someone you follow">
            <InfoIcon boxSize={3} color="gray.400" />
          </Tooltip>
        </Flex>
        <Textarea
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          size="sm"
        />
      </FormControl>
      
      {showMenu && filteredUsers.length > 0 && (
        <Box
          position="absolute"
          zIndex={10}
          bg="white"
          borderWidth={1}
          borderRadius="md"
          boxShadow="md"
          mt={1}
          maxH="200px"
          overflowY="auto"
          w="100%"
          _dark={{ bg: "gray.800", borderColor: "gray.700" }}
        >
          {filteredUsers.map(user => (
            <Flex
              key={user.fid}
              p={2}
              alignItems="center"
              cursor="pointer"
              _hover={{ bg: "gray.100" }}
              _dark={{ _hover: { bg: "gray.700" } }}
              onClick={() => handleSelectUser(user.username)}
            >
              <Avatar size="xs" src={user.pfp_url} mr={2} />
              <Box>
                <Text fontWeight="bold">{user.display_name}</Text>
                <Text fontSize="xs">@{user.username}</Text>
              </Box>
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
} 