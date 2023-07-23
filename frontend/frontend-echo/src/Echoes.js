import { ethers } from "ethers";
import { useQuery, gql } from "@apollo/client";
import { useToast, Spinner } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import QRCode from "qrcode.react";

// GraphQL query to retrieve notices given a cursor
const GET_NOTICES = gql`
    query GetNotices($cursor: String) {
        notices(first: 10, after: $cursor) {
            totalCount
            pageInfo {
                hasNextPage
                endCursor
            }
            edges {
                node {
                    index
                    input {
                        index
                    }
                    payload
                }
            }
        }
    }
`;
let qrCodeValue = ""; // Use an empty string as the default value

// This component renders all the Notices produced by the Echo DApp.
// The Echo Dapp uses notices to echo the Inputs it receives.
// This component sends GraphQL requests to the Cartesi Rollups Query Server
function EchoesList() {
    const toast = useToast();
    const [cursor, setCursor] = useState(null);
    const [qrCodeValue, setQrCodeValue] = useState("");

    // Retrieve notices every 500 ms
    const { loading, error, data } = useQuery(GET_NOTICES, {
        variables: { cursor },
        pollInterval: 500,
    });

    // Check query status
    useEffect(() => {
        if (loading) {
            toast({
                title: "Loading Query Server results",
                status: "info",
                duration: 5000,
                isClosable: true,
                position: "top-right",
            });
        }
        if (error) {
            toast({
                title: "Error querying Query Server ",
                description: `Check browser console for details`,
                status: "error",
                duration: 20000,
                isClosable: true,
                position: "top-right",
            });
            console.error(
                `Error querying Query Server : ${JSON.stringify(error)}`
            );
        }
    });

    //Check query result
    const length = data?.notices?.edges?.length;
    let returnData = null;
    if (length) {
        // Update cursor so that next GraphQL poll retrieves only newer data
        setCursor(data.notices.pageInfo.endCursor);

        // Render new echoes
        const newEchoes = data?.notices?.edges?.map(({ node }) => {
            // Render echo from notice
            try {
                const echo = ethers.utils.toUtf8String(node.payload);
                console.log(`Detected new echo : ${echo}`);
                // Define el patrón de regex para extraer el monto y la dirección del receptor
                // Acepta tanto "Eth" como "Ethereum", y nombres de dominio con múltiples segmentos.
                let pattern =
                    /Send\s+(\d+(\.\d+)?)\s+(Eth|Ethereum|eth|ethereum|ETH)\s+to\s+([\w\.]+)/;

                // Busca el patrón en el input_string
                let match = echo.match(pattern);

                if (match) {
                    // Extrae el monto y la dirección del receptor desde los grupos capturados por el patrón de regex
                    let amount = parseFloat(match[1]);
                    let receiverAddress = match[4];

                    returnData = JSON.stringify({ amount, receiverAddress });
                    console.log(`Detected returnData : ${returnData}`);
                } else {
                    throw new Error("Input inválido");
                }

                if (returnData) {
                    // Parse the returnData string back into an object
                    const parsedReturnData = JSON.parse(returnData);

                    // Create the transaction data object
                    // Destructure the amount and receiver_address values
                    const { amount, receiverAddress } = parsedReturnData;
                    //const adr_ens = Web3.eth.ens.resolver(receiver_address);
                    const valueInWei = ethers.utils.parseEther(
                        amount.toString()
                    );

                    const transactionData = {
                        to: receiverAddress,
                        value: valueInWei.toString(), // Convertir a cadena porque value es un objeto BigNumber
                        gas: 21000, // Establecer un límite de gas estándar para una transacción simple
                        data: "0x", // No hay datos en una transacción simple
                    };

                    const data = JSON.stringify(transactionData);
                    console.log("data", data);
                    setQrCodeValue(data);
                    console.log("qrCode:", qrCodeValue);
                    return qrCodeValue ? (
                        <QRCode value={qrCodeValue}></QRCode>
                    ) : null;
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: `${error.message}`,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        });
    }
    return qrCodeValue ? <QRCode value={qrCodeValue}></QRCode> : <Spinner />;
}

function Echoes() {
    return (
        <div>
            <EchoesList />
        </div>
    );
}

export default Echoes;
