import { ethers } from "ethers";
import { useQuery, gql } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { MetaMaskSDK } from "@metamask/sdk";

function Metamask() {
    const options = {};
    const MMSDK = new MetaMaskSDK(options);

    return (
        <div>
            <label>
                <p>METAMASK...</p>
            </label>
        </div>
    );
}

export default Metamask;
