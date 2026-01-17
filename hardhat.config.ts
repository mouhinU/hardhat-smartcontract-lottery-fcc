import { defineConfig } from "hardhat/config"
import hardhatEthers from "@nomicfoundation/hardhat-ethers"
import hardhatTypechain from "@nomicfoundation/hardhat-typechain"
import hardhatMocha from "@nomicfoundation/hardhat-mocha"
import hardhatVerify from "@nomicfoundation/hardhat-verify"
import hardhatEthersChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers"
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers"
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers"
import HardhatIgnitionEthersPlugin from "@nomicfoundation/hardhat-ignition-ethers"

import "@nomicfoundation/hardhat-ignition"
import "@nomicfoundation/hardhat-ethers"
import "@nomicfoundation/hardhat-typechain"
import "@nomicfoundation/hardhat-mocha"
import "@nomicfoundation/hardhat-ethers-chai-matchers"
import "@nomicfoundation/hardhat-network-helpers"
import "@nomicfoundation/hardhat-toolbox-mocha-ethers"

import "@nomicfoundation/hardhat-ethers"
import "dotenv/config"

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "http://localhost:8545"
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "http://localhost:8545"
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""

console.info(`SEPOLIA_RPC_URL : ${SEPOLIA_RPC_URL}`)
console.info(`ETHERSCAN_API_KEY : ${ETHERSCAN_API_KEY}`)

export default defineConfig({
    plugins: [
        hardhatVerify,
        hardhatEthers,
        hardhatTypechain,
        hardhatMocha,
        hardhatEthersChaiMatchers,
        hardhatNetworkHelpers,
        hardhatToolboxMochaEthers,
        HardhatIgnitionEthersPlugin,
    ],
    solidity: {
        compilers: [
            // {
            //     version: "0.8.28",
            //     settings: {
            //         optimizer: {
            //             enabled: true,
            //             runs: 200,
            //         },
            //     },
            // },
            {
                version: "0.8.19",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        localhost: {
            type: "http",
            url: "http://127.0.0.1:8545",
        },
        sepolia: {
            type: "http",
            chainType: "l1",
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
        mainnet: {
            type: "http",
            url: MAINNET_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
    },
    verify: {
        etherscan: {
            apiKey: "YOUR_ETHERSCAN_API_KEY",
        },
    },
    test: {
        solidity: {
            timeout: 40000,
        },
    },
})
