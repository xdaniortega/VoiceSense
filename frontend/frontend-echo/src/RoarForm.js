import React, { useState, useRef } from "react";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { InputBox__factory } from "@cartesi/rollups";
import { Button, useToast } from "@chakra-ui/react";

const DAPP_ADDRESS = "0x142105FC8dA71191b3a13C738Ba0cF4BC33325e2";
const INPUTBOX_ADDRESS = "0x5a723220579C0DCb8C9253E6b4c62e572E379945";
const HARDHAT_DEFAULT_MNEMONIC =
    "test test test test test test test test test test test junk";
const HARDHAT_LOCALHOST_RPC_URL = "http://localhost:8545";

function RoarForm() {
    const [accountIndex] = useState(0);
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [recording, setRecording] = useState(false);
    const audioPlayerRef = useRef(new Audio());
    const mediaRecorderRef = useRef();
    const chunksRef = useRef([]);

    async function sendInput(inputValue) {
        console.log("SENDING INPUT");
        console.log(inputValue);

        setLoading(true);
        const provider = new JsonRpcProvider(HARDHAT_LOCALHOST_RPC_URL);
        const signer = ethers.Wallet.fromMnemonic(
            HARDHAT_DEFAULT_MNEMONIC,
            `m/44'/60'/0'/0/${accountIndex}`
        ).connect(provider);
        const inputBox = InputBox__factory.connect(INPUTBOX_ADDRESS, signer);
        const inputBytes = ethers.utils.isBytesLike(inputValue)
            ? inputValue
            : ethers.utils.toUtf8Bytes(inputValue);
        const tx = await inputBox.addInput(DAPP_ADDRESS, inputBytes);
        const receipt = await tx.wait(1);
        const event = receipt.events?.find((e) => e.event === "InputAdded");
        setLoading(false);
    }

    function startRecording() {
        chunksRef.current = [];
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: "audio/flac; codecs=opus",
                });
                const audioURL = URL.createObjectURL(blob);
                audioPlayerRef.current.src = audioURL;

                // Limpiar los chunks de grabación después de detener la grabación
                //chunksRef.current = [];
            };
            mediaRecorderRef.current.start();
            setRecording(true);
        });
    }

    function stopRecording() {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
        ) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    }

    function playRecording() {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.play();
        }
        console.log("PLAY RECORDING");
    }

    async function sendAudioRecording() {
        console.log("SENDING RECORDING 1");

        if (chunksRef.current.length === 0) {
            return; // No hay grabación para enviar
        }

        setLoading(true);
        const blob = new Blob(chunksRef.current, {
            type: "audio/x-flac",
        });
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log("SENDING RECORDING 2");

        console.log("INPUT ARRAY");
        console.log(uint8Array);
        await sendInput(uint8Array);

        // Limpiar el localStorage
        localStorage.clear();
    }

    return (
        <div>
            {!recording ? (
                <Button onClick={startRecording} colorScheme="blue">
                    Record
                </Button>
            ) : (
                <Button onClick={stopRecording} colorScheme="red">
                    Stop
                </Button>
            )}
            <Button onClick={playRecording} colorScheme="green">
                Play Back
            </Button>
            <Button onClick={sendAudioRecording} colorScheme="purple">
                Send Audio
            </Button>
        </div>
    );
}

export default RoarForm;
