import { expect } from "chai";
import hre from "hardhat";

const ethers = hre.ethers;

describe("Raffle Unit Tests", function () {
  let raffle;
  let vrfCoordinatorMock;
  let deployer;
  let player;

  const ENTRANCE_FEE = ethers.parseEther("0.1");
  const INTERVAL = 30n;

  beforeEach(async function () {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    player = accounts[1];

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

  describe("Raffle Entry Tests", function () {
    it("Should allow players to enter the raffle", async function () {
      const txResponse = await raffle
        .connect(player)
        .enterRaffle({ value: ENTRANCE_FEE });
      await txResponse.wait(1);

      const playerAddress = await player.getAddress();
      const playerFromContract = await raffle.getPlayer(0);

      expect(playerFromContract).to.equal(playerAddress);
    });

    it("Should fail if entrance fee is not enough", async function () {
      await expect(
        raffle.connect(player).enterRaffle({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWithCustomError(raffle, "Raffle__SendMoreToEnterRaffle");
    });

    it("Should emit RaffleEnter event when player enters", async function () {
      const playerAddress = await player.getAddress();
      await expect(raffle.connect(player).enterRaffle({ value: ENTRANCE_FEE }))
        .to.emit(raffle, "RaffleEnter")
        .withArgs(playerAddress);
    });

    it("Should increase the number of players", async function () {
      const initialCount = await raffle.getNumberOfPlayers();
      await raffle.connect(player).enterRaffle({ value: ENTRANCE_FEE });
      const finalCount = await raffle.getNumberOfPlayers();

      expect(finalCount).to.equal(initialCount + 1n);
    });
  });

  describe("CheckUpkeep Tests", function () {
    it("Should return false when raffle has no players", async function () {
      const { upkeepNeeded } = await raffle.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });

    it("Should return false when raffle state is CALCULATING", async function () {
      await raffle.connect(player).enterRaffle({ value: ENTRANCE_FEE });

      await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
      await ethers.provider.send("evm_mine", []);

      await raffle.performUpkeep("0x");

      const { upkeepNeeded } = await raffle.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });

    it("Should return false when enough time hasn't passed", async function () {
      await raffle.connect(player).enterRaffle({ value: ENTRANCE_FEE });
      const { upkeepNeeded } = await raffle.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });

    it("Should return true when all conditions are met", async function () {
      await raffle.connect(player).enterRaffle({ value: ENTRANCE_FEE });

      await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
      await ethers.provider.send("evm_mine", []);

      const { upkeepNeeded } = await raffle.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;
    });
  });

  describe("PerformUpkeep Tests", function () {
    it("Should revert if upkeep is not needed", async function () {
      await expect(raffle.performUpkeep("0x")).to.be.revertedWithCustomError(
        raffle,
        "Raffle__UpkeepNotNeeded"
      );
    });

    it("Should change raffle state to CALCULATING", async function () {
      await raffle.connect(player).enterRaffle({ value: ENTRANCE_FEE });

      await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
      await ethers.provider.send("evm_mine", []);

      const txResponse = await raffle.performUpkeep("0x");
      await txResponse.wait(1);

      const { upkeepNeeded } = await raffle.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });

    it("Should emit RequestedRaffleWinner event", async function () {
      await raffle.connect(player).enterRaffle({ value: ENTRANCE_FEE });

      await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(raffle.performUpkeep("0x")).to.emit(
        raffle,
        "RequestedRaffleWinner"
      );
    });
  });

  describe("Getter Functions Tests", function () {
    it("Should return correct entrance fee", async function () {
      const fee = await raffle.getEntranceFee();
      expect(fee).to.equal(ENTRANCE_FEE);
    });

    it("Should return correct number of words", async function () {
      const numWords = await raffle.getNumWords();
      expect(numWords).to.equal(2n);
    });

    it("Should return correct request confirmations", async function () {
      const confirmations = await raffle.getRequestConfirmations();
      expect(confirmations).to.equal(3n);
    });

    it("Should return recent winner address", async function () {
      const initialWinner = await raffle.getRecentWinner();
      expect(initialWinner).to.equal(ethers.ZeroAddress);

      await raffle.connect(player).enterRaffle({ value: ENTRANCE_FEE });
      await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
      await ethers.provider.send("evm_mine", []);

      await raffle.performUpkeep("0x");
      await ethers.provider.send("evm_mine", []);

      const winner = await raffle.getRecentWinner();
      expect(winner).not.to.equal(ethers.ZeroAddress);
    });
  });

  describe("Edge Cases and Integration", function () {
    it("Should handle multiple raffle cycles", async function () {
      const accounts = await ethers.getSigners();

      // First cycle
      await raffle.connect(accounts[1]).enterRaffle({ value: ENTRANCE_FEE });
      await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
      await ethers.provider.send("evm_mine", []);

      const txResponse1 = await raffle.performUpkeep("0x");
      await txResponse1.wait(1);
      await ethers.provider.send("evm_mine", []);

      const winner1 = await raffle.getRecentWinner();
      expect(winner1).not.to.equal(ethers.ZeroAddress);

      // Second cycle
      await raffle.connect(accounts[2]).enterRaffle({ value: ENTRANCE_FEE });
      await ethers.provider.send("evm_increaseTime", [Number(INTERVAL) + 1]);
      await ethers.provider.send("evm_mine", []);

      const txResponse2 = await raffle.performUpkeep("0x");
      await txResponse2.wait(1);
      await ethers.provider.send("evm_mine", []);

      const winner2 = await raffle.getRecentWinner();
      expect(winner2).not.to.equal(ethers.ZeroAddress);
    });

    it("Should handle contract receiving exact entrance fee multiple times", async function () {
      const accounts = await ethers.getSigners();

      for (let i = 1; i <= 3; i++) {
        await raffle.connect(accounts[i]).enterRaffle({ value: ENTRANCE_FEE });
      }

      const playerCount = await raffle.getNumberOfPlayers();
      expect(playerCount).to.equal(3n);
    });
  });
});
