import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import hre from "hardhat"
const { networkName, networkConfig } = await hre.network.connect()
import { networkConfigs } from "../../helper-hardhat-config.js"

export const RaffleMoulde = buildModule("RaffleMoulde", (m) => {
    const chainId = networkConfig.chainId
    let vrfCoordinatorV2Address
    let subscriptionId
    const raffleArgs = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfigs[chainId!]["gasLane"],
        networkConfigs[chainId!]["keepersUpdateInterval"],
        networkConfigs[chainId!]["raffleEntranceFee"],
        networkConfigs[chainId!]["callbackGasLimit"],
    ]
    console.log(`raffleArgs :${raffleArgs}`)

    const raffle = m.contract("Raffle", [])
    return { raffle }
})
