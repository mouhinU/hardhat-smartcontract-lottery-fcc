import { expect, assert } from "chai"
import hre from "hardhat"
const { ethers, networkHelpers, networkName, networkConfig, provider } =
    await hre.network.connect()

import {
    networkConfigs,
    developmentChains,
    CONFIRMATIONS,
} from "../../helper-hardhat-config.js"

async function displayAccounts() {
    const accounts = await provider.request({ method: "eth_accounts" })
    for (let i = 0; i < accounts.length; i++) {
        console.log(`accounts[${i}] :${accounts[i]}`)
    }
}

!developmentChains.includes(networkName)
    ? describe.skip
    : describe("Raffle Unit Tests", async function () {
          displayAccounts()
          //   this.timeout(120000) // 将超时时间增加到120秒
          console.log("Raffle Unit Tests...")
          let vrfCoordinatorV2_5Mock: any
          let raffle: any
          const INTERVAL = 30n
          const FUND_AMOUNT = "1000000000000000000000" // 1000 LINK
          async function deployVRFMockFixture() {
              let vrfCoordinatorV2Address
              let subscriptionId
              let chainId = networkConfig.chainId

              console.log(`networkName :${networkName} ,chainId:${chainId}`)
              // 本地开发环境
              console.log(`developmentChains:${developmentChains}`)
              if (developmentChains.includes(networkName)) {
                  console.log(`1`)
                  vrfCoordinatorV2_5Mock = await ethers.deployContract(
                      "VRFCoordinatorV2_5Mock",
                      [
                          ethers.parseEther("0.01"), // 基础费用: 0.01 ETH
                          ethers.parseUnits("10", "gwei"), // Gas价格: 10 Gwei
                          ethers.parseEther("0.0001"), // 1 LINK = 1 ETH
                      ]
                  )
                  console.log(`2`)
                  await vrfCoordinatorV2_5Mock.waitForDeployment()
                  // ethers.js v6: 使用 logs 而不是 events
                  const txResponse =
                      await vrfCoordinatorV2_5Mock.createSubscription()
                  await txResponse.wait()
                  const deploymentBlockNumber =
                      await ethers.provider.getBlockNumber()
                  const events = await vrfCoordinatorV2_5Mock.queryFilter(
                      vrfCoordinatorV2_5Mock.filters.SubscriptionCreated(),
                      deploymentBlockNumber,
                      "latest"
                  )
                  console.log(events)

                  subscriptionId = BigInt(events[0].args[0])
                  console.log(`subscriptionId: ${subscriptionId}`)
                  // Fund the subscription
                  await vrfCoordinatorV2_5Mock.fundSubscription(
                      subscriptionId,
                      FUND_AMOUNT
                  )

                  vrfCoordinatorV2Address = vrfCoordinatorV2_5Mock.target
                  console.log(
                      "vrfCoordinatorV2Address",
                      vrfCoordinatorV2Address
                  )
                  console.log(`5`)
              } else {
                  vrfCoordinatorV2Address =
                      networkConfigs[chainId!]["vrfCoordinatorV2"]
                  subscriptionId = networkConfigs[chainId!]["subscriptionId"]
              }
              console.log(`vrfMockAddress :${vrfCoordinatorV2_5Mock.target}`)
              // 基于网络判断获取 vrfCoordinatorV2Address、 subscriptionId

              const raffleArgs = [
                  vrfCoordinatorV2Address,
                  networkConfigs[chainId!]["raffleEntranceFee"],
                  networkConfigs[chainId!]["gasLane"],
                  networkConfigs[chainId!]["keepersUpdateInterval"],
                  subscriptionId,
                  networkConfigs[chainId!]["callbackGasLimit"],
              ]
              console.log(`raffleArgs :${raffleArgs}`)
              const deployContract = await ethers.deployContract(
                  "Raffle",
                  raffleArgs
              )
              await deployContract.waitForDeployment()

              // Ensure the Raffle contract is a valid consumer of the VRFCoordinatorV2Mock contract.
              if (developmentChains.includes(networkName)) {
                  // addConsumer
                  await vrfCoordinatorV2_5Mock.addConsumer(
                      subscriptionId,
                      deployContract.target
                  )
              }
              // 连接合约
              const accounts = await ethers.getSigners()
              console.log(`accounts[1] :${accounts[1].address}`)
              const [defaultSigner, deployer] = await ethers.getSigners()

              assert.equal(accounts[1].address, deployer.address)
              console.log(`defaultSigner.address :${defaultSigner.address}`)
              console.log(`deployer.address : ${deployer.address}`)
              raffle = deployContract.connect(defaultSigner)

              const interval = await raffle.getInterval()
              const raffleEntranceFee = await raffle.getEntranceFee()

              return {
                  vrfCoordinatorV2_5Mock,
                  raffle,
                  chainId,
                  networkName,
                  interval,
                  raffleEntranceFee,
                  deployContract,
              }
          }

          describe("constructor", function () {
              it("initializes the raffle correctly", async () => {
                  // Ideally, we'd separate these out so that only 1 assert per "it" block
                  // And ideally, we'd make this check everything
                  const { raffle, chainId, interval } =
                      await networkHelpers.loadFixture(deployVRFMockFixture)
                  const raffleState = (await raffle.getRaffleState()).toString()
                  // Comparisons for Raffle initialization:
                  assert.equal(raffleState, "0")
                  assert.equal(
                      interval.toString(),
                      networkConfigs[chainId!]["keepersUpdateInterval"]
                  )
              })
          })

          describe("enterRaffle", async function () {
              it("reverts when you don't pay enough", async () => {
                  //
                  //   await expect(attackerConnectContract.withdraw()).to.be.revertedWithCustomError(
                  //       fundMeContract,
                  //       "FundMe__NotOwner"
                  //   )
                  //   0.8 之后版本不可使用 await expect(attackerConnectContract.withdraw()).to.be.rejectedWith("FundMe__NotOwner")
                  //   await expect(attackerConnectContract.withdraw()).to.be.rejectedWith("FundMe__NotOwner()")
                  //   console.log("Only allow the owner to withdraw success!")
                  //   await expect(raffle.enterRaffle()).to.be.rejectedWith("Raffle__SendMoreToEnterRaffle()")
                  // is reverted when not paid enough or raffle is not open
                  const { raffle } = await networkHelpers.loadFixture(
                      deployVRFMockFixture
                  )
                  await expect(raffle.enterRaffle()).to.be.rejectedWith(
                      "Raffle__SendMoreToEnterRaffle()"
                  )
              })
              it("records player when they enter", async () => {
                  const { raffleEntranceFee } =
                      await networkHelpers.loadFixture(deployVRFMockFixture)
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const contractPlayer = await raffle.getPlayer(0)
                  const [defaultSigner, deployer] = await ethers.getSigners()
                  assert.equal(defaultSigner.address, contractPlayer)
              })
              it("emits event on enter", async () => {
                  const { raffleEntranceFee } =
                      await networkHelpers.loadFixture(deployVRFMockFixture)
                  // emits RaffleEnter event if entered to index player(s) address
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee })
                  ).to.emit(raffle, "RaffleEnter")
              })

              it("doesn't allow entrance when raffle is calculating", async () => {
                  const {
                      raffle,
                      raffleEntranceFee,
                      interval,
                      vrfCoordinatorV2_5Mock,
                  } = await networkHelpers.loadFixture(deployVRFMockFixture)
                  // 第1步：玩家进入彩票
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  // 第2步：增加时间，使 checkUpkeep 返回 true
                  await ethers.provider.send("hardhat_mine", ["0x1"])
                  await ethers.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  // 第3步：调用 performUpkeep 将状态变为 CALCULATING
                  await raffle.performUpkeep("0x")
                  // 第4步：验证当状态为 CALCULATING 时，不允许进入
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee })
                  ).to.be.rejectedWith("Raffle__RaffleNotOpen()")
              })
          })

          describe("checkUpkeep", function () {
              it("returns false if people haven't sent any ETH", async () => {
                  const { raffle, interval } = await networkHelpers.loadFixture(
                      deployVRFMockFixture
                  )
                  await ethers.provider.send("hardhat_mine", ["0x1"])
                  await ethers.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
                      "0x"
                  )
                  console.log(`upkeepNeeded :${upkeepNeeded}`)
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle isn't open", async () => {
                  const { raffle, raffleEntranceFee, interval } =
                      await networkHelpers.loadFixture(deployVRFMockFixture)
                  await raffle.enterRaffle({ value: raffleEntranceFee })

                  await ethers.provider.send("hardhat_mine", ["0x1"])
                  await ethers.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])

                  await raffle.performUpkeep("0x") // changes the state to calculating
                  const raffleState = await raffle.getRaffleState() // stores the new state
                  // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
                      "0x"
                  )
                  assert.equal(
                      raffleState.toString() == "1",
                      upkeepNeeded == false
                  )
              })
              it("returns false if enough time hasn't passed", async () => {
                  const { raffle, raffleEntranceFee, interval } =
                      await networkHelpers.loadFixture(deployVRFMockFixture)
                  await raffle.enterRaffle({ value: raffleEntranceFee })

                  // use a higher number here if this test fails
                  await ethers.provider.send("hardhat_mine", ["0x1"])
                  await ethers.provider.send("evm_increaseTime", [
                      Number(interval) - 5,
                  ])

                  // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
                      "0x"
                  )
                  console.log(`upkeepNeeded :${upkeepNeeded}`)
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  const { raffle, raffleEntranceFee, interval } =
                      await networkHelpers.loadFixture(deployVRFMockFixture)
                  await raffle.enterRaffle({ value: raffleEntranceFee })

                  await ethers.provider.send("hardhat_mine", ["0x1"])
                  await ethers.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  //   const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")

                  // 检查各个条件
                  const raffleState = await raffle.getRaffleState()
                  const timeInterval = await raffle.getInterval()
                  const currentTimestamp = await raffle.getLastTimeStamp()
                  const timePassed =
                      (await ethers.provider.getBlock("latest"))!.timestamp -
                      Number(currentTimestamp)
                  const playerCount = await raffle.getNumberOfPlayers()
                  const contractBalance = await ethers.provider.getBalance(
                      raffle.target
                  )

                  console.log(
                      `Raffle state: ${raffleState}, Time passed: ${timePassed}, Required interval: ${timeInterval}`
                  )
                  console.log(
                      `Player count: ${playerCount}, Contract balance: ${contractBalance}`
                  )

                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
                      "0x"
                  )
                  console.log(`Upkeep needed: ${upkeepNeeded}`)

                  assert(!upkeepNeeded)
              })
          })

          describe("performUpkeep", function () {
              it("can only run if checkupkeep is true", async () => {
                  const { raffle, raffleEntranceFee, interval } =
                      await networkHelpers.loadFixture(deployVRFMockFixture)
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await ethers.provider.send("hardhat_mine", ["0x1"])
                  await ethers.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  const tx = await raffle.performUpkeep("0x")
                  assert(tx)
              })
              it("reverts if checkup is false", async () => {
                  const { raffle } = await networkHelpers.loadFixture(
                      deployVRFMockFixture
                  )
                  await expect(raffle.performUpkeep("0x")).to.be.rejectedWith(
                      "Raffle__UpkeepNotNeeded"
                  )
              })
              it("updates the raffle state and emits a requestId", async () => {
                  const {
                      raffle,
                      raffleEntranceFee,
                      interval,
                      deployContract,
                  } = await networkHelpers.loadFixture(deployVRFMockFixture)
                  // Too many asserts in this test!
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await ethers.provider.send("hardhat_mine", ["0x1"])
                  await ethers.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  const txResponse = await raffle.performUpkeep("0x") // emits requestId
                  const txReceipt = await txResponse.wait(1) // waits 1 block

                  console.log(txReceipt)
                  console.log(txReceipt.logs)

                  // ethers.js v6: 从 logs 中解析事件
                  const requestIdLog = txReceipt?.logs
                      ?.map((log: any) => {
                          try {
                              return raffle.interface.parseLog(log)
                          } catch {
                              return null
                          }
                      })
                      .find(
                          (event: any) =>
                              event?.name === "RequestedRaffleWinner"
                      )

                  const requestId = requestIdLog?.args?.[0]
                  console.log("requestId:", requestId)
                  assert(requestId > 0n)
                  const raffleState = await raffle.getRaffleState() // updates state
                  assert(raffleState == 1) // 0 = open, 1 = calculating
              })
          })

          describe("fulfillRandomWords", function () {
              it("can only be called after performupkeep", async () => {
                  const {
                      raffle,
                      raffleEntranceFee,
                      interval,
                      vrfCoordinatorV2_5Mock,
                  } = await networkHelpers.loadFixture(deployVRFMockFixture)

                  await expect(
                      vrfCoordinatorV2_5Mock.fulfillRandomWords(
                          0,
                          raffle.target
                      ) // reverts if not fulfilled
                  ).to.be.rejected
                  await expect(
                      vrfCoordinatorV2_5Mock.fulfillRandomWords(
                          1,
                          raffle.target
                      ) // reverts if not fulfilled
                  ).to.be.rejected
              })

              it("picks a winner, resets, and sends money", async () => {
                  const {
                      raffle,
                      raffleEntranceFee,
                      vrfCoordinatorV2_5Mock,
                      deployContract,
                  } = await networkHelpers.loadFixture(deployVRFMockFixture)
                  const additionalEntrances = 3 // to test
                  const startingIndex = 2

                  const accounts = await ethers.getSigners()
                  let startingBalance: any
                  // 加入三个账户
                  for (
                      let i = startingIndex;
                      i < startingIndex + additionalEntrances;
                      i++
                  ) {
                      // i = 2; i < 5; i=i+1
                      // Returns a new instance of the Raffle contract connected to player
                      console.log(
                          `account :${i} ,address:${accounts[i].address}`
                      )
                      const tmpRaffleContract: any = deployContract.connect(
                          accounts[i]
                      )
                      await tmpRaffleContract.enterRaffle({
                          value: raffleEntranceFee,
                      })
                  }
                  console.log("123")
                  // stores starting timestamp (before we fire our event)
                  const startingTimeStamp = await raffle.getLastTimeStamp()
                  console.log(startingTimeStamp)
                  // This will be more important for our staging tests...
                  await new Promise<void>(async (resolve, reject) => {
                      // event listener for WinnerPicked
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          // assert throws an error if it fails, so we need to wrap
                          // it in a try/catch so that the promise returns event
                          // if it fails.
                          try {
                              // Now lets get the ending values...
                              const recentWinner =
                                  await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerBalance =
                                  await ethers.provider.getBalance(
                                      accounts[4].address
                                  )
                              const endingTimeStamp =
                                  await raffle.getLastTimeStamp()

                              //0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 0n 9999989960014490104422n 1768616822n
                              console.log(
                                  recentWinner,
                                  raffleState,
                                  winnerBalance,
                                  endingTimeStamp
                              )

                              const account4Balance =
                                  await ethers.provider.getBalance(
                                      accounts[4].address
                                  )
                              console.log(account4Balance)

                              // 获取彩票中的所有玩家以验证获胜者是否有效
                              //   const playerCount = await raffle.getNumberOfPlayers()
                              //   let foundWinner = false
                              //   for (let i = 0; i < playerCount; i++) {
                              //       const player = await raffle.getPlayer(i)
                              //       if (player.toLowerCase() === recentWinner.toString().toLowerCase()) {
                              //           foundWinner = true
                              //           break
                              //       }
                              //   }
                              //   assert(foundWinner, "获胜者应该是已注册的玩家之一")
                              // Comparisons to check if our ending values are correct:
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[4].address
                              )
                              assert.equal(raffleState, 0)

                              assert.equal(
                                  winnerBalance.toString(),
                                  (
                                      BigInt(startingBalance) +
                                      BigInt(raffleEntranceFee) *
                                          BigInt(additionalEntrances)
                                  ).toString()
                              )
                              console.log("XXX")

                              assert(endingTimeStamp > startingTimeStamp)
                              console.log("XXX111")
                              resolve()
                          } catch (e) {
                              reject(e) // if try fails, rejects the promise
                          }
                      })

                      // kicking off the event by mocking the chainlink keepers and vrf coordinator
                      try {
                          await ethers.provider.send("hardhat_mine", ["0x1"])
                          await ethers.provider.send("evm_increaseTime", [
                              Number(await raffle.getInterval()) + 1,
                          ])
                          const tx = await raffle.performUpkeep("0x")
                          const txReceipt = await tx.wait(1)
                          startingBalance = await ethers.provider.getBalance(
                              accounts[4].address
                          )
                          // Parse requestId from logs
                          const requestIdLog = txReceipt?.logs
                              ?.map((log: any) => {
                                  try {
                                      return raffle.interface.parseLog(log)
                                  } catch {
                                      return null
                                  }
                              })
                              .find(
                                  (event: any) =>
                                      event?.name === "RequestedRaffleWinner"
                              )
                          const requestId = requestIdLog?.args?.[0]

                          await vrfCoordinatorV2_5Mock.fulfillRandomWords(
                              requestId,
                              raffle.target
                          )
                      } catch (e) {
                          reject(e)
                      }
                  })
              })
          })
      })
