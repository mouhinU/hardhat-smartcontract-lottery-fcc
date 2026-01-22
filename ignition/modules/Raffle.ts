import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import hre from "hardhat"
import { ethers, parseEther, parseUnits } from "ethers"

import { networkConfigs, developmentChains } from "../../helper-hardhat-config.js"

const { networkName, networkConfig, provider } = await hre.network.connect()

const getNetworkConfig = () => {
  const chainId = networkConfig.chainId
  console.log(`chainId :${chainId}`)
  if (chainId && networkConfigs[chainId]) {
    console.log(`networkConfigs[chainId] :`, networkConfigs[chainId])
    return networkConfigs[chainId]
  }
  return networkConfigs["default"]
}

const RaffleModule = buildModule("RaffleModule", (m) => {
  let deployVRFCoordinatorV2_5Mock: any = null
  let vrfCoordinatorV2Address
  let subscriptionId
  const FUND_AMOUNT = parseEther("0.001")
  // Get network config by network name first, fallback to chainId
  const config = getNetworkConfig()
  console.log(config)
  // Deploy VRFCoordinatorV2_5Mock for development chains
  if (developmentChains.includes(networkName)) {
    deployVRFCoordinatorV2_5Mock = m.contract("VRFCoordinatorV2_5Mock", [
      parseEther("0.001"), // Base fee: 0.01 ETH
      parseUnits("10", "gwei"), // Gas price: 10 Gwei
      parseEther("1"), // 1 LINK = 1 ETH
    ])
    vrfCoordinatorV2Address = deployVRFCoordinatorV2_5Mock
    // For local development: create a subscription, fund it, and set default id=1
    // createSubscription will emit SubscriptionCreated with id 1 for the first sub
    m.call(deployVRFCoordinatorV2_5Mock, "createSubscription", [], {
      id: "subscriptionId",
    })
    subscriptionId = 1n
  } else {
    vrfCoordinatorV2Address = config?.vrfCoordinatorV2
    subscriptionId = BigInt(config?.subscriptionId || 0)
    console.log(`subscriptionId :${subscriptionId}`)
    console.log(`vrfCoordinatorV2Address :${vrfCoordinatorV2Address}`)
  }

  const raffleArgs = [
    vrfCoordinatorV2Address, // VRF Coordinator address
    config?.raffleEntranceFee, // Entrance fee
    config?.gasLane, // Gas lane
    config?.keepersUpdateInterval, // Interval
    subscriptionId, // Subscription ID
    config?.callbackGasLimit, // Callback gas limit
  ]
  console.log("Raffle Args :", raffleArgs)
  // Deploy Raffle contract
  const deployRaffle = m.contract("Raffle", raffleArgs)

  // If on development chain, fund the subscription
  return {
    deployRaffle,
    ...(deployVRFCoordinatorV2_5Mock && { deployVRFCoordinatorV2_5Mock }),
  }
})

export default RaffleModule
