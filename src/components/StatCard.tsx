import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: IconType;
  colorScheme?: string;
}

export function StatCard({ label, value, icon: Icon, colorScheme = 'orange' }: StatCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const isNumber = typeof value === 'number';
  const bgColor = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.200`);
  const borderColor = useColorModeValue(`${colorScheme}.200`, `${colorScheme}.700`);
  
  useEffect(() => {
    if (isNumber) {
      const startValue = 0;
      const endValue = value as number;
      const duration = 1000; // ms
      const frameDuration = 1000 / 60; // 60fps
      const totalFrames = Math.round(duration / frameDuration);
      const valueIncrement = (endValue - startValue) / totalFrames;
      
      let currentFrame = 0;
      
      const timer = setInterval(() => {
        currentFrame++;
        const newValue = Math.min(startValue + (valueIncrement * currentFrame), endValue);
        setAnimatedValue(Math.floor(newValue));
        
        if (currentFrame >= totalFrames) {
          clearInterval(timer);
        }
      }, frameDuration);
      
      return () => clearInterval(timer);
    }
  }, [value, isNumber]);
  
  return (
    <Box 
      p={4} 
      borderRadius="md" 
      bg={bgColor} 
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
    >
      <Flex align="center" mb={2}>
        <Box mr={2} color={iconColor}>
          <Icon size={20} />
        </Box>
        <Text fontWeight="bold" fontSize="sm">
          {label}
        </Text>
      </Flex>
      <Text fontSize="xl" fontWeight="bold">
        {isNumber ? animatedValue : value}
      </Text>
    </Box>
  );
} 