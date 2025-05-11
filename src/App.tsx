import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import { createConfig, WagmiConfig, useAccount, useConnect, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";
import { ActivityFeed } from "./components/ActivityFeed";
import { ActivityTracker } from "./components/ActivityTracker";
import { Profile } from "./components/Profile";
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Button,
  Flex,
  Text,
  useColorModeValue,
  Stack,
} from "@chakra-ui/react";

// Create Wagmi config with the Farcaster Mini App connector
const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector()
  ]
});

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // Chakra Tabs are controlled, so we need state
  const [tabIndex, setTabIndex] = useState(0);
  const tabBg = useColorModeValue("gray.200", "gray.700");
  const tabActiveBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <WagmiConfig config={config}>
      <Box maxW="424px" mx="auto" minH="695px" bg="gray.900">
        <Box p={4}>
          <ConnectMenu />
          <Tabs
            index={tabIndex}
            onChange={setTabIndex}
            variant="unstyled"
            mt={4}
          >
            <TabList
              display="grid"
              gridTemplateColumns="repeat(3, 1fr)"
              bg={tabBg}
              borderRadius="lg"
              borderWidth={1}
              borderColor={borderColor}
              mb={2}
            >
              <Tab
                _selected={{ bg: tabActiveBg, color: "orange.500", fontWeight: "bold" }}
                borderRadius="md"
              >
                Feed
              </Tab>
              <Tab
                _selected={{ bg: tabActiveBg, color: "orange.500", fontWeight: "bold" }}
                borderRadius="md"
              >
                Track
              </Tab>
              <Tab
                _selected={{ bg: tabActiveBg, color: "orange.500", fontWeight: "bold" }}
                borderRadius="md"
              >
                Profile
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <ActivityFeed />
              </TabPanel>
              <TabPanel px={0}>
                <ActivityTracker />
              </TabPanel>
              <TabPanel px={0}>
                <Profile />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    </WagmiConfig>
  );
}

function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  // Check if we're in a Farcaster environment
  const isFarcasterEnv = window.location.hostname === 'localhost' ? false : true;

  if (isConnected) {
    return (
      <Flex align="center" justify="space-between" p={4} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
        <Stack direction="row" align="center" spacing={2}>
          <Text fontSize="sm" fontWeight="medium">Connected:</Text>
          <Text fontSize="sm" color={mutedColor}>{address}</Text>
        </Stack>
      </Flex>
    );
  }

  if (!isFarcasterEnv) {
    return (
      <Flex align="center" justify="center" p={4} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
        <Text fontSize="sm" color={mutedColor}>
          Open in Farcaster Mini App Debug Tool to test wallet connection
        </Text>
      </Flex>
    );
  }

  return (
    <Button onClick={() => connect({ connector: connectors[0] })} w="full" colorScheme="orange">
      Connect Wallet
    </Button>
  );
}

export default App;
