import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { config } from "./wagmi";
import App from "./App";
import "./index.css";
import { ChakraProvider, extendTheme, ColorModeScript } from "@chakra-ui/react";

const queryClient = new QueryClient();

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
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </ChakraProvider>
  </React.StrictMode>
);
