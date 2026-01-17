# Hardhat Smart Contract Lottery - Raffle Project

利用 Hardhat 3.1.4 的新特性，完成了一个完整的智能合约彩票系统。

## 项目结构

```
├── contracts/
│   ├── Raffle.sol                  # 主彩票合约
│   └── test/
│       └── VRFCoordinatorV2_5Mock.sol  # Chainlink VRF模拟合约
├── test/
│   ├── Raffle.test.js              # 单元测试
│   └── Raffle.integration.test.js   # 集成测试
├── scripts/
│   ├── deploy.js                   # 部署脚本
│   └── verify.js                   # 验证脚本
├── hardhat.config.ts               # Hardhat配置
└── .env.example                    # 环境变量示例
```

## 环境配置

### 1. 安装依赖

```bash
yarn install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

需要配置的变量：

- `SEPOLIA_RPC_URL`: Sepolia 测试网 RPC 地址
- `MAINNET_RPC_URL`: 主网 RPC 地址
- `PRIVATE_KEY`: 部署账户的私钥
- `ETHERSCAN_API_KEY`: Etherscan API 密钥（用于合约验证）
- `ENTRANCE_FEE`: 参与彩票的费用（默认 0.1 ETH）
- `INTERVAL`: 彩票周期（默认 30 秒）
- `SEPOLIA_VRF_COORDINATOR`: Sepolia 上的 VRF 协调器地址
- `SEPOLIA_GAS_LANE`: Gas Lane 配置
- `SEPOLIA_SUBSCRIPTION_ID`: VRF 订阅 ID

## 合约功能

### Raffle.sol

主要功能：

1. **enterRaffle()** - 支付入场费参与彩票
2. **checkUpkeep()** - 检查是否满足执行条件
3. **performUpkeep()** - 执行彩票逻辑，请求随机数
4. **fulfillRandomWords()** - 接收随机数并选择赢家
5. **getter functions** - 获取合约状态信息

### VRFCoordinatorV2_5Mock.sol

模拟 Chainlink VRF 协调器，用于本地测试和开发。

## 使用方法

### 编译合约

```bash
yarn compile
```

这会生成 TypeChain 类型定义文件在 `typechain-types/` 目录下。

### 运行测试

```bash
# 运行所有测试
yarn test

# 运行单元测试
yarn test:unit

# 运行集成测试
yarn test:integration

# 生成覆盖率报告
yarn test:coverage
```

### 验证部署

在 Hardhat 本地网络上验证所有功能：

```bash
yarn verify:deployment
```

这会执行以下验证：

1. 部署 VRFCoordinatorV2_5Mock
2. 部署 Raffle 合约
3. 验证所有 getter 函数
4. 测试 enterRaffle 功能
5. 测试 checkUpkeep 逻辑
6. 测试 performUpkeep 和赢家选择

### 部署合约

#### 本地部署（Hardhat）

```bash
# 启动本地节点
yarn node

# 在新终端中部署
yarn deploy:localhost
```

#### Sepolia 测试网部署

```bash
yarn deploy:sepolia
```

#### 主网部署

```bash
yarn deploy:mainnet
```

部署脚本会自动：

- 部署 VRF 协调器（本地）或使用配置的地址（测试网/主网）
- 部署 Raffle 合约
- 输出部署地址和配置信息
- 在非本地网络上自动验证合约（如果配置了 ETHERSCAN_API_KEY）

## 网络配置

Hardhat 配置中定义了以下网络：

- **hardhat**: 内置的本地网络（chainId: 31337）
- **localhost**: 本地节点（http://127.0.0.1:8545）
- **sepolia**: Sepolia 测试网（chainId: 11155111）
- **mainnet**: 以太坊主网（chainId: 1）

## 使用 Hardhat 3.1.4 的新特性

### 1. 改进的配置系统

```typescript
// hardhat.config.ts 使用更简洁的defineConfig
export default defineConfig({
  solidity: { version: "0.8.28" },
  networks: {
    /* ... */
  },
  etherscan: {
    /* ... */
  },
});
```

### 2. 增强的部署脚本

使用 JavaScript/TypeScript 部署脚本，更灵活的部署流程：

```javascript
const raffle = await RaffleFactory.deploy(...);
await raffle.waitForDeployment();
```

### 3. 改进的类型支持

- 使用 ethers v6 和 hardhat-ethers v4
- 完整的 TypeScript 支持
- 自动生成 TypeChain 类型定义

### 4. 支持多个网络配置

在 `.env` 文件中配置不同网络的参数，脚本会自动加载对应配置。

## 合约详解

### Raffle.sol 主要变量

```solidity
// Chainlink VRF变量
VRFCoordinatorV2Interface i_vrfCoordinator;
bytes32 i_keyHash;                  // Gas lane
uint64 i_subscriptionId;            // VRF订阅ID
uint32 i_callbackGasLimit;          // 回调Gas限制

// 彩票变量
uint256 i_entranceFee;              // 入场费
uint256 i_interval;                 // 彩票周期
address[] s_players;                // 参与者列表
RaffleState s_raffleState;          // 彩票状态（OPEN/CALCULATING）
address s_recentWinner;             // 最近赢家
```

### 关键流程

1. **参与者进入**：调用 `enterRaffle()` 支付入场费
2. **检查条件**：`checkUpkeep()` 验证是否满足触发条件
3. **请求随机数**：`performUpkeep()` 向 VRF 协调器请求随机数
4. **选择赢家**：`fulfillRandomWords()` 接收随机数并选择赢家
5. **分配奖励**：将所有奖池转给赢家，重置彩票

## 安全性考虑

- 使用自定义错误而不是 require 消息（gas 优化）
- Checks-Effects-Interactions 模式
- 使用 Chainlink VRF 进行真正的随机数生成
- 使用 Chainlink Automation 进行自动化执行

## 测试覆盖

- ✓ 入场测试
- ✓ 费用验证
- ✓ 事件发射验证
- ✓ 状态转换测试
- ✓ 边界情况处理
- ✓ 多周期彩票流程
- ✓ 完整集成流程

## 常见问题

### Q: 如何在本地测试 VRF 功能？

A: 使用 VRFCoordinatorV2_5Mock 合约，它会自动响应 VRF 请求。

### Q: 如何部署到测试网？

A:

1. 获取 Sepolia RPC URL（从 Alchemy 或 Infura）
2. 创建新账户获取私钥
3. 在.env 中配置这些值
4. 运行 `yarn deploy:sepolia`

### Q: 合约如何自动执行？

A: 使用 Chainlink Automation，它会定期调用 `performUpkeep()` 函数。

## 许可证

MIT

## 参考资源

- [Hardhat 文档](https://hardhat.org)
- [Chainlink VRF 文档](https://docs.chain.link/docs/vrf)
- [Chainlink Automation 文档](https://docs.chain.link/docs/automation/introduction)
- [Ethers.js 文档](https://docs.ethers.org)
