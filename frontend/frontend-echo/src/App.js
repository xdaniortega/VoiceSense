import "./App.css";
import RoarForm from "./RoarForm";
import Echoes from "./Echoes";
import React, { useState, useEffect } from "react";
import {
    Box,
    Flex,
    Spacer,
    Heading,
    Button,
    useColorMode,
    HStack,
    Container,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import {
    EthereumClient,
    w3mConnectors,
    w3mProvider,
} from "@web3modal/ethereum";
import { Web3Modal, useWeb3Modal, Web3Button } from "@web3modal/react";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { goerli, hardhat } from "wagmi/chains";
import { infuraProvider } from "@wagmi/core/providers/infura";

// Simple App to present the Input field and produced Notices
function App() {
    const [accountIndex] = useState(0);
    const { colorMode, toggleColorMode } = useColorMode();

    const chainsdefinition = [goerli, hardhat];
    const projectId = "5f48353918f5739d49b45c217683f7a8";

    const { chains, publicClient } = configureChains(chainsdefinition, [
        w3mProvider({
            projectId: projectId,
        }),
        infuraProvider({ apiKey: "8981940ba6cd457195acaf4c69fb10fa" }),
    ]);

    const wagmiConfig = createConfig({
        autoConnect: true,
        connectors: w3mConnectors({ projectId, chains }),
        publicClient,
    });
    const ethereumClient = new EthereumClient(wagmiConfig, chains);

    return (
        <div className="App">
            <Flex
                as="nav"
                p={4}
                boxShadow="md"
                position="sticky"
                top={0}
                zIndex={1}
                justify="space-between"
                align="center"
                bg={colorMode === "light" ? "white" : "gray.800"}
                color={colorMode === "light" ? "black" : "white"}
            >
                <Heading as="h1" size="lg">
                    VoiceSense
                </Heading>
                <HStack>
                    <Button onClick={toggleColorMode}>
                        {colorMode === "dark" ? <MoonIcon /> : <SunIcon />}
                    </Button>
                    <Web3Button />
                </HStack>
            </Flex>
            <Container maxW="container.md" py={8}>
                <WagmiConfig config={wagmiConfig}>
                    <Flex direction="column" rounded="md" shadow="md">
                        <RoarForm accountIndex={accountIndex} />
                        <Spacer />
                        <Echoes />
                    </Flex>{" "}
                </WagmiConfig>
                <Web3Modal
                    projectId={projectId}
                    ethereumClient={ethereumClient}
                />
            </Container>
        </div>
    );
}

export default App;
