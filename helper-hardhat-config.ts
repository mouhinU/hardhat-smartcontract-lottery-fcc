import hre from "hardhat"

const { ethers } = await hre.network.connect()

export interface networkConfigItem {
  name?: string
  subscriptionId?: string
  gasLane?: string
  keepersUpdateInterval?: string
  raffleEntranceFee?: any
  callbackGasLimit?: string
  vrfCoordinatorV2?: string
}

export interface networkConfigInfo {
  [key: string]: networkConfigItem
}

export const networkConfigs: networkConfigInfo = {
  default: {
    name: "hardhat",
    keepersUpdateInterval: "30",
  },
  31337: {
    name: "localhost",
    subscriptionId: "588",
    gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", // 500 gwei
    keepersUpdateInterval: "30",
    raffleEntranceFee: ethers.parseEther("0.01"), // 0.01 ETH
    callbackGasLimit: "500000", // 500,000 gas
  },
  11155111: {
    name: "sepolia",
    // https://vrf.chain.link/sepolia
    subscriptionId: "45676143188931107610289831950255096350249122743562737521286451682112436531102",
    // https://docs.chain.link/vrf/v2-5/supported-networks
    gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", // 500 gwei
    keepersUpdateInterval: "30",
    raffleEntranceFee: ethers.parseEther("0.01"), // 0.01 ETH
    callbackGasLimit: "500000", // 500,000 gas
    vrfCoordinatorV2: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
  },
  1: {
    name: "mainnet",
    keepersUpdateInterval: "30",
  },
}

export const developmentChains = ["hardhat", "localhost", "default"]
export const CONFIRMATIONS = 6
