# Hardhat Raffle 快速开始指南

## 项目概述

这是一个使用 **Hardhat 3.1.4** 构建的完整智能合约彩票系统，包含：

- ✅ Raffle 智能合约
- ✅ Chainlink VRF 集成（随机数生成）
- ✅ 完整的单元和集成测试
- ✅ 部署脚本（支持多个网络）
- ✅ 类型安全的 TypeChain 支持
- ✅ 环境配置管理

## 快速开始（5 分钟）

### 1. 安装依赖

```bash
cd hardhat-smartcontract-lottery-fcc
yarn install
```

### 2. 编译合约

```bash
yarn compile
```

输出示例：

```
Compiled 2 Solidity files with solc 0.8.28
```

### 3. 运行验证

```bash
yarn verify:deployment
```

这会在本地 Hardhat 网络上部署合约并验证所有功能。

## 项目命令参考

### 编译和类型生成

```bash
yarn compile              # 编译Solidity合约
yarn typechain            # 生成TypeChain类型定义
yarn clean                # 清除编译产物
```

### 测试

```bash
yarn test                 # 运行所有测试
yarn test:unit            # 仅运行单元测试
yarn test:integration     # 仅运行集成测试
yarn test:coverage        # 生成测试覆盖率报告
```

### 部署

```bash
yarn node                 # 启动本地节点

# 在新终端运行部署
yarn deploy               # 部署到默认网络（hardhat）
yarn deploy:localhost     # 部署到本地节点
yarn deploy:sepolia       # 部署到Sepolia测试网
yarn deploy:mainnet       # 部署到以太坊主网
```

## 详细配置

### 环境变量设置

1. **复制配置文件**

   ```bash
   cp .env.example .env
   ```

2. **编辑 `.env` 并填入你的配置**

   ```env
   # RPC 端点
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY
   MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY

   # 部署账户私钥（不要包含0x前缀）
   PRIVATE_KEY=your_private_key_here

   # Etherscan验证（可选）
   ETHERSCAN_API_KEY=your_etherscan_api_key

   # Chainlink VRF配置（Sepolia）
   SEPOLIA_VRF_COORDINATOR=0x9ddfaca8183c41ad55329bdffbe6e13862a87f50
   SEPOLIA_GAS_LANE=0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae
   SEPOLIA_SUBSCRIPTION_ID=123  # 你的VRF订阅ID

   # 彩票配置
   ENTRANCE_FEE=100000000000000000  # 0.1 ETH (wei)
   INTERVAL=30                      # 30秒
   ```

## 合约结构

### Raffle.sol

**主要函数：**

| 函数                   | 说明                    | 触发事件                |
| ---------------------- | ----------------------- | ----------------------- |
| `enterRaffle()`        | 支付入场费参与彩票      | `RaffleEnter`           |
| `checkUpkeep()`        | 检查是否可以执行彩票    | -                       |
| `performUpkeep()`      | 触发彩票逻辑            | `RequestedRaffleWinner` |
| `fulfillRandomWords()` | 接收 VRF 结果并选择赢家 | `WinnerPicked`          |
| `getEntranceFee()`     | 获取入场费              | -                       |
| `getNumberOfPlayers()` | 获取当前参与人数        | -                       |
| `getRecentWinner()`    | 获取最近赢家            | -                       |

**状态变量：**

- `RaffleState`: 彩票状态（OPEN/CALCULATING）
- `s_players`: 参与者地址列表
- `s_recentWinner`: 最近赢家地址
- `s_lastTimeStamp`: 上次彩票时间戳

## 测试用例

项目包含 **20+ 个测试用例**，涵盖：

### 单元测试 (`test/Raffle.test.js`)

- ✓ 玩家进入彩票
- ✓ 入场费验证
- ✓ 事件发射验证
- ✓ 状态转换测试
- ✓ Getter 函数验证
- ✓ 边界情况处理

### 集成测试 (`test/Raffle.integration.test.js`)

- ✓ 完整彩票周期（参与 → 等待 → 选择 → 重置）
- ✓ 多个连续彩票周期
- ✓ 资金累积和分配
- ✓ 事件监听验证
- ✓ 单个玩家场景
- ✓ 快速连续参与

## 网络配置

项目配置支持以下网络：

| 网络      | ChainId  | RPC URL               | 用途     |
| --------- | -------- | --------------------- | -------- |
| hardhat   | 31337    | 内置                  | 本地测试 |
| localhost | 31337    | http://127.0.0.1:8545 | 本地节点 |
| sepolia   | 11155111 | .env 配置             | 测试网   |
| mainnet   | 1        | .env 配置             | 主网     |

## 部署流程

### 本地开发流程

```bash
# 终端1：启动本地节点
yarn node

# 终端2：部署合约
yarn deploy:localhost

# 输出示例：
# Network: localhost
# Raffle Address: 0x5FbDB2315678afccb333f8a9fcff...
# VRF Coordinator: 0x8C0416979E3f032...
```

### 测试网部署流程

```bash
# 1. 准备工作
# - 获取Sepolia RPC URL (Alchemy/Infura)
# - 创建部署账户并获取私钥
# - 在.env中配置PRIVATE_KEY和RPC URL
# - 获取测试ETH (faucet)

# 2. 配置VRF
# - 访问 https://vrf.chain.link
# - 创建新的subscription
# - 将subscription ID放入.env

# 3. 部署
yarn deploy:sepolia

# 4. 验证（可选，需要ETHERSCAN_API_KEY）
# 脚本会自动验证
```

## 使用 Hardhat 3.1.4 的特性

### 1. 改进的网络配置

```typescript
// 使用 defineConfig 获得完整类型支持
export default defineConfig({
  networks: {
    sepolia: {
      type: "http",
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
});
```

### 2. 增强的脚本系统

```javascript
// 使用现代化的部署脚本
const raffle = await RaffleFactory.deploy(...);
await raffle.waitForDeployment();
const address = await raffle.getAddress();
```

### 3. TypeChain 类型生成

```javascript
// 完全类型安全的合约交互
yarn typechain  // 自动生成 typechain-types/

// 在脚本中
import type { Raffle } from "../typechain-types/index.js";
```

## 故障排除

### 问题：测试失败 "Cannot determine a test runner"

**解决：** 确保测试文件为 `.js` 格式，位于 `test/` 目录下

### 问题：部署时 "VRF Coordinator not configured"

**解决：** 检查.env 文件中的 SEPOLIA_VRF_COORDINATOR 和 SEPOLIA_SUBSCRIPTION_ID 是否正确设置

### 问题：交易失败 "Raffle\_\_SendMoreToEnterRaffle"

**解决：** 确保发送的 ETH 数量不少于 ENTRANCE_FEE（默认 0.1 ETH）

### 问题：权限拒绝 ".env" file not found

**解决：** 运行 `cp .env.example .env`

## 下一步

1. **本地测试**

   - 运行 `yarn test` 验证所有功能
   - 运行 `yarn verify:deployment` 演示完整流程

2. **部署到测试网**

   - 配置 `.env` 文件
   - 运行 `yarn deploy:sepolia`

3. **集成 Chainlink Automation**

   - 在 https://automation.chain.link 上注册 upkeep
   - 让网络自动触发彩票

4. **前端集成**
   - 使用 `typechain-types/` 中的类型
   - 集成 Web3 库（ethers.js/web3.js）

## 文件结构详解

```
├── contracts/
│   ├── Raffle.sol          # 主彩票合约 (~160行)
│   └── test/
│       └── VRFCoordinatorV2_5Mock.sol  # VRF模拟
├── test/
│   ├── Raffle.test.js      # 单元测试 (~200行，15+用例)
│   └── Raffle.integration.test.js  # 集成测试 (~300行，8+用例)
├── scripts/
│   ├── deploy.js           # 部署脚本 (~120行)
│   └── verify.sh           # 验证脚本
├── artifacts/              # 编译输出
├── typechain-types/        # TypeChain生成的类型定义
├── .env.example            # 环境配置模板
├── hardhat.config.ts       # Hardhat配置
├── tsconfig.json           # TypeScript配置
└── package.json            # 项目配置和脚本
```

## 安全考虑

✅ **实施的安全措施：**

- 使用自定义错误而不是 require 消息（gas 优化）
- Checks-Effects-Interactions 模式
- 防止重入攻击
- Chainlink VRF 确保真正随机性
- 状态机防止无效操作

## 许可证

MIT License

## 支持

如有问题，请检查：

1. [Hardhat 文档](https://hardhat.org)
2. [Chainlink 文档](https://docs.chain.link)
3. 项目的 `README_CN.md` 详细文档

---

**最后更新：2026 年 1 月 15 日**  
**Hardhat 版本：3.1.4**  
**Solidity 版本：0.8.28**
