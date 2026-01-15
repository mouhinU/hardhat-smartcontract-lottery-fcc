import { ethers, network } from "hardhat";

const networkConfig: any = {
  11155111: {
    // Sepolia
    name: "sepolia",
    vrfCoordinator: process.env.SEPOLIA_VRF_COORDINATOR || "",
    entranceFee:
      process.env.ENTRANCE_FEE || ethers.parseEther("0.01").toString(),
    gasLane: process.env.SEPOLIA_GAS_LANE || "",
    subscriptionId: process.env.SEPOLIA_SUBSCRIPTION_ID || "0",
    callbackGasLimit: process.env.SEPOLIA_CALLBACK_GAS_LIMIT || "500000",
    interval: process.env.INTERVAL || "30",
  },
  1: {
    // Mainnet
    name: "mainnet",
    vrfCoordinator: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    entranceFee: ethers.parseEther("0.01").toString(),
    gasLane: "0x9fe0eebf5e446e3c461f3fa3e9cd0dd4da467520",
    subscriptionId: "0",
    callbackGasLimit: "500000",
    interval: "30",
  },
  31337: {
    // Hardhat/Localhost
    name: "hardhat",
    entranceFee: ethers.parseEther("0.1").toString(),
    gasLane:
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    callbackGasLimit: "500000",
    interval: "30",
  },
};

async function deployRaffle() {
  const [deployer] = await ethers.getSigners();
  const chainId = network.config.chainId || 31337;

  console.log("\n" + "=".repeat(60));
  console.log("Deploying Raffle Contract");
  console.log("=".repeat(60));
  console.log(`\nNetwork: ${network.name}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Deployer: ${deployer.address}`);

  let vrfCoordinatorAddress: string;

  if (chainId === 31337) {
    // Deploy mock on local network
    console.log("\nDeploying VRFCoordinatorV2_5Mock...");
    const VRFCoordinatorFactory = await ethers.getContractFactory(
      "VRFCoordinatorV2_5Mock"
    );
    const vrfCoordinator = await VRFCoordinatorFactory.deploy();
    await vrfCoordinator.waitForDeployment();
    vrfCoordinatorAddress = await vrfCoordinator.getAddress();
    console.log(
      `✓ VRFCoordinatorV2_5Mock deployed at: ${vrfCoordinatorAddress}`
    );
  } else {
    // Use real VRF coordinator on testnet/mainnet
    vrfCoordinatorAddress = networkConfig[chainId]?.vrfCoordinator;
    if (!vrfCoordinatorAddress) {
      throw new Error(`VRF Coordinator not configured for chainId ${chainId}`);
    }
    console.log(`Using VRFCoordinator: ${vrfCoordinatorAddress}`);
  }

  const config = networkConfig[chainId];
  const args = [
    vrfCoordinatorAddress,
    config.entranceFee,
    config.gasLane,
    config.interval,
    config.subscriptionId,
    config.callbackGasLimit,
  ];

  console.log("\nRaffle Constructor Arguments:");
  console.log(`  - VRF Coordinator: ${args[0]}`);
  console.log(`  - Entrance Fee: ${ethers.formatEther(args[1])} ETH`);
  console.log(`  - Gas Lane: ${args[2]}`);
  console.log(`  - Interval: ${args[3]} seconds`);
  console.log(`  - Subscription ID: ${args[4]}`);
  console.log(`  - Callback Gas Limit: ${args[5]}`);

  console.log("\nDeploying Raffle...");
  const RaffleFactory = await ethers.getContractFactory("Raffle");
  const raffle = await RaffleFactory.deploy(
    args[0],
    args[1],
    args[2],
    args[3],
    args[4],
    args[5]
  );

  await raffle.waitForDeployment();
  const raffleAddress = await raffle.getAddress();

  console.log(`✓ Raffle deployed at: ${raffleAddress}`);

  // Log deployment info
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Raffle Address: ${raffleAddress}`);
  console.log(`VRF Coordinator: ${vrfCoordinatorAddress}`);
  console.log(`Entrance Fee: ${ethers.formatEther(config.entranceFee)} ETH`);
  console.log(`Interval: ${config.interval} seconds`);

  // Verify contract on Etherscan if not on local network
  if (chainId !== 31337 && process.env.ETHERSCAN_API_KEY) {
    console.log("\nVerifying on Etherscan...");
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await (ethers as any).hardhat.run("verify:verify", {
        address: raffleAddress,
        constructorArguments: args,
      });
      console.log("✓ Contract verified on Etherscan");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✓ Contract already verified on Etherscan");
      } else {
        console.log(`Error verifying contract: ${error.message}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60) + "\n");

  return { raffle, vrfCoordinator: vrfCoordinatorAddress };
}

deployRaffle().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
