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
import { arbitrum, mainnet, polygon } from "wagmi/chains";
import SignClient from "@walletconnect/sign-client";

// Simple App to present the Input field and produced Notices
function App() {
    const [accountIndex] = useState(0);
    const { colorMode, toggleColorMode } = useColorMode();

    const chains = [arbitrum, mainnet, polygon];
    const projectId = "5f48353918f5739d49b45c217683f7a8";

    const { publicClient } = configureChains(chains, [
        w3mProvider({ projectId }),
    ]);
    const wagmiConfig = createConfig({
        autoConnect: true,
        connectors: w3mConnectors({ projectId, chains }),
        publicClient,
    });
    const ethereumClient = new EthereumClient(wagmiConfig, chains);
    const { open, close } = useWeb3Modal();

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
                        {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
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
