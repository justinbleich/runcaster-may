import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { config } from "./wagmi";
import App from "./App";
import "./index.css";
import { ChakraProvider, extendTheme, ColorModeScript, useToast } from "@chakra-ui/react";
import { supabase } from "./lib/supabase";

const queryClient = new QueryClient();

// Add Supabase connection check component
function SupabaseConnectionChecker() {
  const toast = useToast();
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simple ping to check connection
        const { error } = await supabase.from('activities').select('id').limit(1);
        
        if (error) {
          console.error('Supabase connection error:', error);
          toast({
            title: 'Database connection error',
            description: 'Could not connect to Supabase. Some features may not work correctly.',
            status: 'error',
            duration: 10000,
            isClosable: true,
          });
        } else {
          console.log('Successfully connected to Supabase');
        }
      } catch (err) {
        console.error('Failed to check Supabase connection:', err);
      }
    };
    
    checkConnection();
  }, [toast]);
  
  return null;
}

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  colors: {
    orange: {
      50: "#fff3e6",
      100: "#ffe0b3",
      200: "#ffcc80",
      300: "#ffb84d",
      400: "#ffa31a",
      500: "#ff5500", // main accent
      600: "#cc4400",
      700: "#993300",
      800: "#662200",
      900: "#331100",
    },
    gray: {
      900: "#181818",
      800: "#232323",
      700: "#333",
      600: "#444",
      500: "#555",
      400: "#aaa",
      300: "#ccc",
      200: "#eee",
      100: "#f5f5f5",
      50: "#fafafa",
    },
  },
  styles: {
    global: {
      body: {
        bg: "gray.900",
        color: "white",
        fontFamily: "Inter, sans-serif",
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <SupabaseConnectionChecker />
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </ChakraProvider>
  </React.StrictMode>
);
