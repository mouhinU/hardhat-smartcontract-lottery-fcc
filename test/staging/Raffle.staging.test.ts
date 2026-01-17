import { expect } from "chai"
import hre from "hardhat"
const { ethers, networkHelpers, networkName, networkConfig } = await hre.network.connect()

import { networkConfigs, developmentChains, CONFIRMATIONS } from "../../helper-hardhat-config.js"

developmentChains.includes(networkName)
    ? describe.skip
    : describe("Raffle Staging Tests", async function () {
          console.log("Raffle Staging Tests...")
          let accounts: any
          let vrfCoordinatorV2_5Mock: any
          let raffle: any
          const INTERVAL = 30n
          const FUND_AMOUNT = "1000000000000000000000"

          async function deployVRFMockFixture() {
              let vrfCoordinatorV2Address
              let subscriptionId
              let chainId = networkConfig.chainId

              console.log(`networkName :${networkName} ,chainId:${chainId}`)
              // 本地开发环境
              console.log(`developmentChains:${developmentChains}`)
              if (developmentChains.includes(networkName)) {
                  console.log(`1`)
                  vrfCoordinatorV2_5Mock = await ethers.deployContract("VRFCoordinatorV2_5Mock", [
                      ethers.parseEther("0.01"), // 基础费用: 0.01 ETH
                      ethers.parseUnits("10", "gwei"), // Gas价格: 10 Gwei
                      ethers.parseEther("1"), // 1 LINK = 1 ETH
                  ])
                  console.log(`2`)
                  await vrfCoordinatorV2_5Mock.waitForDeployment()
                  // ethers.js v6: 使用 logs 而不是 events
                  const txResponse = await vrfCoordinatorV2_5Mock.createSubscription()
                  await txResponse.wait()
                  const deploymentBlockNumber = await ethers.provider.getBlockNumber()
                  const events = await vrfCoordinatorV2_5Mock.queryFilter(
                      vrfCoordinatorV2_5Mock.filters.SubscriptionCreated(),
                      deploymentBlockNumber,
                      "latest"
                  )
                  console.info(events)

                  subscriptionId = BigInt(events[0].args[0])
                  console.log(`subscriptionId: ${subscriptionId}`)
                  // Fund the subscription
                  await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, FUND_AMOUNT)

                  vrfCoordinatorV2Address = vrfCoordinatorV2_5Mock.target
                  console.log("vrfCoordinatorV2Address", vrfCoordinatorV2Address)
                  console.log(`5`)
              } else {
                  vrfCoordinatorV2Address = networkConfigs[chainId!]["vrfCoordinatorV2"]
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
              raffle = await ethers.deployContract("Raffle", raffleArgs)
              await raffle.waitForDeployment()
              console.log(raffle)
              return { vrfCoordinatorV2_5Mock, raffle }
          }

          describe("Raffle Entry Tests", async function () {
              it("Should allow players to enter the raffle", async function () {
                  console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                  console.log("Should allow players to enter the raffle")
                  const { vrfCoordinatorV2_5Mock, raffle } = await networkHelpers.loadFixture(deployVRFMockFixture)
                  console.log(`vrfMock Address :${vrfCoordinatorV2_5Mock.target}`)
                  console.log(`raffle Address :${raffle.target}`)

                  const [defaultSigner, deployer] = await ethers.getSigners()
                  console.log(`defaultSigner.address :${defaultSigner.address}`)
                  console.log(`deployer.address : ${deployer.address}`)

                  console.log("==========================================================")
              })

              // it("Should fail if entrance fee is not enough", async function () {
              //   console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
              //   console.log("Should fail if entrance fee is not enough")
              //   console.log(`vrfMock Address :${vrfCoordinatorV2_5Mock.target}`)

              //   console.log("==========================================================")
              // })

              // it("Should emit RaffleEnter event when player enters", async function () {
              //   console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
              //   console.log("Should emit RaffleEnter event when player enters")
              //   console.log(`vrfMock Address :${vrfCoordinatorV2_5Mock.target}`)

              //   console.log("==========================================================")
              // })

              // it("Should increase the number of players", async function () {
              //   console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
              //   console.log("Should increase the number of players")
              //   console.log(`vrfMock Address :${vrfCoordinatorV2_5Mock.target}`)

              //   console.log("==========================================================")
              // })
          })
      })
