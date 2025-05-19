import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState, Component, ReactNode } from "react";
import { createConfig, WagmiConfig, useAccount, useConnect, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";
import { ActivityFeed } from "./components/ActivityFeed";
import { ActivityTracker } from "./components/ActivityTracker";
import { Profile } from "./components/Profile";
import { Challenges } from "./components/Challenges";
import { ChallengeAdmin } from "./components/admin/ChallengeAdmin";
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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
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

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    console.error(`Error in ${this.props.componentName}:`, error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Alert status="error" variant="solid" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="lg" py={4}>
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Component Error
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            The {this.props.componentName} component encountered an error.
            <Text mt={2} fontSize="sm">{this.state.error?.message}</Text>
            <Button 
              onClick={() => this.setState({ hasError: false, error: null })}
              colorScheme="red"
              size="sm" 
              mt={4}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // Chakra Tabs are controlled, so we need state
  const [tabIndex, setTabIndex] = useState(0);
  const tabBg = useColorModeValue("gray.200", "gray.700");
  const tabActiveBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const { isConnected } = useAccount();
  
  // Check if admin URL is specified
  const isAdmin = window.location.pathname === "/admin";

  // If admin route, show admin interface instead of regular app
  if (isAdmin) {
    return (
      <WagmiConfig config={config}>
        <Box maxW="100%" mx="auto" minH="100vh" bg="white" color="black">
          <ErrorBoundary componentName="ChallengeAdmin">
            <ChallengeAdmin />
          </ErrorBoundary>
        </Box>
      </WagmiConfig>
    );
  }

  return (
    <WagmiConfig config={config}>
      <Box maxW="424px" mx="auto" minH="695px" bg="gray.900">
        <Box p={4}>
          {!isConnected && <ConnectMenu />}
          <Tabs
            index={tabIndex}
            onChange={setTabIndex}
            variant="unstyled"
            mt={4}
          >
            <TabList
              display="grid"
              gridTemplateColumns="repeat(4, 1fr)"
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
                Challenges
              </Tab>
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
                <ErrorBoundary componentName="Challenges">
                  <Challenges />
                </ErrorBoundary>
              </TabPanel>
              <TabPanel px={0}>
                <ErrorBoundary componentName="ActivityFeed">
                  <ActivityFeed />
                </ErrorBoundary>
              </TabPanel>
              <TabPanel px={0}>
                <ErrorBoundary componentName="ActivityTracker">
                  <ActivityTracker />
                </ErrorBoundary>
              </TabPanel>
              <TabPanel px={0}>
                <ErrorBoundary componentName="Profile">
                  <Profile />
                </ErrorBoundary>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    </WagmiConfig>
  );
}

function ConnectMenu() {
  const { connect, connectors } = useConnect();
  const cardBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  // Check if we're in a Farcaster environment
  const isFarcasterEnv = window.location.hostname === 'localhost' ? false : true;

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
