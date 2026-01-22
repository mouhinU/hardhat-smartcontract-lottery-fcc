import { expect, assert } from "chai"
import hre from "hardhat"
const { ethers, networkName, networkConfig } = await hre.network.connect()
import { networkConfigs, developmentChains } from "../../helper-hardhat-config.js"

const RAFFLE_CONTRACT_ADDRESS = process.env.RAFFLE_CONTRACT_ADDRESS || ""
console.log(`RAFFLE_CONTRACT_ADDRESS : ${RAFFLE_CONTRACT_ADDRESS}`)

developmentChains.includes(networkName)
  ? describe.skip
  : describe("Raffle Staging Tests", async function () {
      console.log("Raffle Staging Tests...")

      this.timeout(3000000) // 5 minutes
      const INTERVAL = 30n
      const FUND_AMOUNT = "1000000000000000000000"

      let raffle: any
      let chainId = networkConfig.chainId
      let raffleEntranceFee: any
      let networkName: any
      let interval: any

      beforeEach(async function () {
        console.log(`networkName :${networkName} ,chainId:${chainId}`)
        // 本地开发环境
        console.log(`developmentChains: ${developmentChains}`)
        const [deployer] = await ethers.getSigners()
        console.log(`Using account: ${deployer.address}`)
        // 获取 Raffle 抽奖的入场费
        raffleEntranceFee = await networkConfigs[chainId!]["raffleEntranceFee"]
        console.log(`Raffle Entrance Fee : ${raffleEntranceFee}`)

        // 获取 Raffle 合约实例
        const RaffleFactory = await ethers.getContractFactory("Raffle", deployer)
        // 连接到已部署的 Raffle 合约
        raffle = RaffleFactory.attach(RAFFLE_CONTRACT_ADDRESS)

        console.log(`Raffle address : `, raffle)
        console.log("\n=== Contract Information ===")
        console.log(`State: ${await raffle.getRaffleState()}`)
        console.log(`Entrance Fee: ${ethers.formatEther(await raffle.getEntranceFee())} ETH`)
        console.log(`Interval: ${await raffle.getInterval()} seconds`)
        console.log(`Last Timestamp: ${await raffle.getLastTimeStamp()}`)
        console.log(`Number of Players: ${await raffle.getNumberOfPlayers()}`)

        try {
          // 获取最近的获胜者
          const recentWinner = await raffle.getRecentWinner()
          console.log(`Recent Winner: ${recentWinner}`)
        } catch (e) {
          console.log(`Recent Winner: None yet`)
        }
        // 获取合约的账户余额
        const initialContractBalance = await ethers.provider.getBalance(raffle.target)
        console.log(`Initial Contract balance: ${initialContractBalance}`)
      })

      // async function deployVRFMockFixture() {}

      describe("fulfillRandomWords", function () {
        it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
          // enter the raffle
          console.log("Setting up test...")
          const startingTimeStamp = await raffle.getLastTimeStamp()
          const accounts = await ethers.getSigners()
          console.log("Setting up Listener...")
          await new Promise<void>(async (resolve, reject) => {
            // setup listener before we enter the raffle
            // Just in case the blockchain moves REALLY fast
            raffle.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired!")
              try {
                // add our asserts here
                const recentWinner = await raffle.getRecentWinner()
                const raffleState = await raffle.getRaffleState()

                const winnerEndingBalance = await ethers.provider.getBalance(recentWinner)
                const endingTimeStamp = await raffle.getLastTimeStamp()

                console.log(`Recent Winner : ${recentWinner}`)
                console.log(`Raffle State : ${raffleState}`)
                console.log(`Winner Ending Balance : ${winnerEndingBalance}`)
                console.log(`Ending TimeStamp : ${endingTimeStamp}`)
                console.log(`Starting TimeStamp : ${startingTimeStamp}`)
                // assert.equal(recentWinner.toString(), accounts[0].address)
                assert(endingTimeStamp > startingTimeStamp)
                assert.equal(raffleState, 0)
                assert.equal(winnerEndingBalance, winnerStartingBalance + raffleEntranceFee)
                resolve()
              } catch (error) {
                console.log(error)
                reject(error)
              }
            })
            let winnerStartingBalance: any
            // Then entering the raffle
            const [deployer, player] = await ethers.getSigners()

            try {
              console.log("Entering Raffle...")
              const [defaultSigner, deployer] = await ethers.getSigners()
              console.log("Default Signer:", defaultSigner.address)
              const initialAccountBalance = await ethers.provider.getBalance(defaultSigner.address)
              console.log(`Initial Account Balance : ${initialAccountBalance}`)
              // 参与抽奖
              const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
              console.log(tx)
              const txReceipt = await tx.wait(1)
              console.log(txReceipt)
              console.log("Ok, time to wait...")

              const contractBalance = await ethers.provider.getBalance(raffle.target)
              console.log(`Raffle Contract balance: ${contractBalance}`)

              winnerStartingBalance = await ethers.provider.getBalance(defaultSigner.address)
              console.log(`Winner Starting Balance : ${winnerStartingBalance}`)
              // 日志输出,等待监听器完成
              console.log("Waiting for WinnerPicked event...")
            } catch (error: any) {
              console.error("Error entering raffle: ", error)
              // 可以进一步解析错误信息
              if (error.data) {
                console.log("Error data: ", error.data)
              }
              throw error
            }
            // and this code WONT complete until our listener has finished listening!
          })
        })
      })
    })
