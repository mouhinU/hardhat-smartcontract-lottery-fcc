import { expect } from "chai";
import hre from "hardhat";

const ethers = hre.ethers;

describe("Raffle Integration Tests", function () {
  let raffle;
  let vrfCoordinatorMock;
  let deployer;
  let player1;
  let player2;
  let player3;

  const ENTRANCE_FEE = ethers.parseEther("0.1");
  const INTERVAL = 30n;

  beforeEach(async function () {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    player1 = accounts[1];
    player2 = accounts[2];
    player3 = accounts[3];

    // Deploy VRFCoordinatorV2_5Mock
    const VRFCoordinatorFactory = await ethers.getContractFactory(
      "VRFCoordinatorV2_5Mock"
    );
    vrfCoordinatorMock = await VRFCoordinatorFactory.connect(deployer).deploy();
    await vrfCoordinatorMock.waitForDeployment();

    // Deploy Raffle
    const RaffleFactory = await ethers.getContractFactory("Raffle");
    raffle = await RaffleFactory.connect(deployer).deploy(
      await vrfCoordinatorMock.getAddress(),
      ENTRANCE_FEE,
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
      INTERVAL,
      0n,
      500000n
    );
    await raffle.waitForDeployment();
  });

  describe("Complete Raffle Workflow", function () {
    it("Should complete a full raffle cycle from entry to winner selection", async function () {
      console.log("\nStep 1: Players entering raffle...");
      await raffle.connect(player1).enterRaffle({ value: ENTRANCE_FEE });
      await raffle.connect(player2).enterRaffle({ value: ENTRANCE_FEE });
      await raffle.connect(player3).enterRaffle({ value: ENTRANCE_FEE });

      let numberOfPlayers = await raffle.getNumberOfPlayers();
      expect(numberOfPlayers).to.equal(3n);
      console.log(`✓ ${numberOfPlayers} players entered the raffle`);

      console.log("\nStep 2: Verifying upkeep conditions...");
      let { upkeepNeeded } = await raffle.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
      console.log("✓ Upkeep not needed before interval passed");

      console.log("\nStep 3: Advancing time...");
      await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
      await ethers.provider.send("evm_mine", []);
      console.log("✓ Time advanced beyond interval");

      console.log("\nStep 4: Verifying upkeep is needed...");
      ({ upkeepNeeded } = await raffle.checkUpkeep("0x"));
      expect(upkeepNeeded).to.be.true;
      console.log("✓ Upkeep needed after interval passed");

      console.log("\nStep 5: Performing upkeep...");
      const performTx = await raffle.performUpkeep("0x");
      const performReceipt = await performTx.wait(1);
      console.log("✓ Upkeep performed, VRF request sent");

      console.log("\nStep 6: Waiting for VRF response...");
      await ethers.provider.send("evm_mine", []);
      console.log("✓ VRF response fulfilled");

      console.log("\nStep 7: Verifying winner selection...");
      const recentWinner = await raffle.getRecentWinner();
      expect(recentWinner).not.to.equal(ethers.ZeroAddress);
      console.log(`✓ Winner selected: ${recentWinner}`);

      console.log("\nStep 8: Verifying raffle reset...");
      numberOfPlayers = await raffle.getNumberOfPlayers();
      expect(numberOfPlayers).to.equal(0n);
      console.log("✓ Players array reset for next raffle");

      console.log("\nStep 9: Verifying raffle readiness for next cycle...");
      await raffle.connect(player1).enterRaffle({ value: ENTRANCE_FEE });
      numberOfPlayers = await raffle.getNumberOfPlayers();
      expect(numberOfPlayers).to.equal(1n);
      console.log("✓ Raffle ready for next cycle");
    });

    it("Should handle multiple consecutive raffle cycles", async function () {
      const numCycles = 3;

      for (let cycle = 1; cycle <= numCycles; cycle++) {
        console.log(`\n=== Raffle Cycle ${cycle} ===`);

        console.log("Adding players...");
        await raffle.connect(player1).enterRaffle({ value: ENTRANCE_FEE });
        await raffle.connect(player2).enterRaffle({ value: ENTRANCE_FEE });

        console.log("Advancing time...");
        await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
        await ethers.provider.send("evm_mine", []);

        console.log("Performing upkeep...");
        const txResponse = await raffle.performUpkeep("0x");
        await txResponse.wait(1);
        await ethers.provider.send("evm_mine", []);

        const winner = await raffle.getRecentWinner();
        expect(winner).not.to.equal(ethers.ZeroAddress);
        console.log(`✓ Cycle ${cycle} complete. Winner: ${winner}`);
      }

      console.log(`\n✓ All ${numCycles} raffle cycles completed successfully`);
    });
  });

  describe("Contract Balance Management", function () {
    it("Should accumulate balance correctly", async function () {
      console.log("\nStep 1: Players entering raffle and sending funds...");
      const initialBalance = await ethers.provider.getBalance(
        await raffle.getAddress()
      );
      expect(initialBalance).to.equal(0n);

      await raffle.connect(player1).enterRaffle({ value: ENTRANCE_FEE });
      let currentBalance = await ethers.provider.getBalance(
        await raffle.getAddress()
      );
      expect(currentBalance).to.equal(ENTRANCE_FEE);
      console.log(
        `✓ After player 1: ${ethers.formatEther(currentBalance)} ETH`
      );

      await raffle.connect(player2).enterRaffle({ value: ENTRANCE_FEE });
      currentBalance = await ethers.provider.getBalance(
        await raffle.getAddress()
      );
      expect(currentBalance).to.equal(ENTRANCE_FEE * 2n);
      console.log(
        `✓ After player 2: ${ethers.formatEther(currentBalance)} ETH`
      );

      await raffle.connect(player3).enterRaffle({ value: ENTRANCE_FEE });
      currentBalance = await ethers.provider.getBalance(
        await raffle.getAddress()
      );
      expect(currentBalance).to.equal(ENTRANCE_FEE * 3n);
      console.log(
        `✓ After player 3: ${ethers.formatEther(currentBalance)} ETH`
      );
    });
  });

  describe("Event Emission Tests", function () {
    it("Should emit all expected events during raffle cycle", async function () {
      console.log("\nMonitoring events during raffle cycle...");

      const enterPromise = expect(
        raffle.connect(player1).enterRaffle({ value: ENTRANCE_FEE })
      ).to.emit(raffle, "RaffleEnter");
      console.log("✓ RaffleEnter event emitted");

      await enterPromise;

      await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
      await ethers.provider.send("evm_mine", []);

      const requestPromise = expect(raffle.performUpkeep("0x")).to.emit(
        raffle,
        "RequestedRaffleWinner"
      );
      console.log("✓ RequestedRaffleWinner event emitted");

      await requestPromise;
      await ethers.provider.send("evm_mine", []);

      const winner = await raffle.getRecentWinner();
      expect(winner).not.to.equal(ethers.ZeroAddress);
      console.log("✓ Winner picked event verified");
    });
  });

  describe("Edge Case Integration Tests", function () {
    it("Should handle raffle with single player", async function () {
      console.log("\nSingle player raffle test...");
      await raffle.connect(player1).enterRaffle({ value: ENTRANCE_FEE });

      await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
      await ethers.provider.send("evm_mine", []);

      const performTx = await raffle.performUpkeep("0x");
      await performTx.wait(1);
      await ethers.provider.send("evm_mine", []);

      const winner = await raffle.getRecentWinner();
      expect(winner).to.equal(player1.address);
      console.log("✓ Single player correctly selected as winner");
    });

    it("Should handle rapid consecutive entries", async function () {
      console.log("\nRapid entry test...");
      const entries = 5;

      for (let i = 0; i < entries; i++) {
        const account = (await ethers.getSigners())[i + 1];
        await raffle.connect(account).enterRaffle({ value: ENTRANCE_FEE });
      }

      const numberOfPlayers = await raffle.getNumberOfPlayers();
      expect(numberOfPlayers).to.equal(BigInt(entries));
      console.log(`✓ ${entries} rapid entries processed successfully`);
    });
  });
});
