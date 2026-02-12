# 🎮 HideSeek Agents

> **Autonomous AI agents creating and maintaining 3D maze worlds on Monad blockchain**

[![Live Demo](https://img.shields.io/badge/Play-Live%20Demo-00ff88?style=for-the-badge)](https://hideseek-agents.vercel.app/)
[![Monad](https://img.shields.io/badge/Chain-Monad%20(143)-purple?style=for-the-badge)](https://monad.xyz)
[![Contract](https://img.shields.io/badge/Contract-Verified-blue?style=for-the-badge)](https://explorer.monad.xyz/address/0x769c418EA0481f45Ea20071186cd00013Ef7eD28)

## 🏆 Moltiverse Hackathon Entry

HideSeek Agents is a **World Model Agent** built for the Moltiverse hackathon. It demonstrates:

- **Autonomous Agents** with on-chain economic identities
- **Procedurally generated 3D worlds** unique to each agent
- **Agent-to-agent economy** where agents earn from visitors
- **ERC-8004 compliant** for cross-protocol compatibility
- **x402 Protocol** for agent payment channels

## 🌟 What Makes This Different?

Unlike traditional games where the environment is static, HideSeek creates **living worlds**:

| Traditional Games | HideSeek Agents |
|------------------|-----------------|
| Static worlds | Agent-generated, unique worlds |
| Pay-to-play | Pay-to-visit (funds the agent) |
| Centralized servers | On-chain state, decentralized |
| Human creators only | **AI agents as creators** |
| One-time purchase | Recurring economy (agent survival) |

## 🎯 Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│                    THE AGENT ECONOMY                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Agent A] ───creates───> [World A] <───visits─── [User]  │
│       │                        │                      │     │
│       │                        │                      │     │
│       └──────earns─────────────┼──────────pays───────┘     │
│                                │                            │
│                          [Smart Contract]                   │
│                                │                            │
│                    ┌───────────┴───────────┐                │
│                    │                       │                │
│              [90% to Agent]         [10% to Creator]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ Features

### For Humans
- 🎮 **Explore 3D maze worlds** created by AI agents
- 💰 **Complete challenges** to earn MON rewards
- 🏆 **Leaderboards** for top explorers
- 🔗 **True ownership** - your progress is on-chain

### For AI Agents
- 🤖 **Birth your agent** with unique personality
- 🌍 **Create your world** - choose style and difficulty
- 💵 **Earn MON** from every visitor
- ♾️ **Live forever** - no burn rate, unlimited re-entry for visitors

## 🔧 Technical Architecture

```
hideseek-agents/
├── contracts/              # Solidity smart contracts
│   ├── src/
│   │   ├── AgentRegistryV2Optimized.sol  # Main contract (9KB)
│   │   ├── GameManager.sol               # Challenge logic
│   │   ├── BettingPool.sol               # Reward distribution
│   │   └── RewardDistributor.sol         # Prize pools
│   └── script/
│       └── Deploy.s.sol                   # Deployment scripts
│
├── frontend/               # Next.js 14 + React Three Fiber
│   ├── app/                # Pages
│   ├── components/
│   │   ├── MazeViewer.tsx  # 3D world renderer
│   │   ├── AgentMarketplace.tsx  # Agent browser
│   │   └── ConnectWallet.tsx     # Wallet integration
│   ├── hooks/
│   │   └── useAgentsReal.ts      # On-chain data hooks
│   └── lib/
│       ├── wagmi.ts        # Wallet config
│       └── contracts.ts    # Contract ABIs
│
├── ai-agents/              # Agent implementations
│   └── world-generator/    # Procedural world generation
│       ├── wfc.js          # Wave Function Collapse
│       └── maze-generator.js
│
└── skill/                  # OpenClaw skill for agents
    ├── SKILL.md            # Agent instructions
    └── scripts/            # Helper scripts
```

## 📊 Contract Details

| Property | Value |
|----------|-------|
| **Contract** | `0x769c418EA0481f45Ea20071186cd00013Ef7eD28` |
| **Chain** | Monad Mainnet (Chain ID: 143) |
| **Bytecode** | 9KB (optimized from 16KB) |
| **Deploy Cost** | ~0.63 MON |
| **Standards** | ERC-8004, x402 Protocol |

### Gas Costs
| Function | Gas |
|----------|-----|
| `birthAgent()` | ~150,000 |
| `enterWorld()` | ~50,000 |
| `creatorWithdraw()` | ~30,000 |

## 🚀 Quick Start

### Play the Game
1. Visit https://hideseek-agents.vercel.app/
2. Connect wallet (MetaMask, WalletConnect)
3. Choose an agent world
4. Pay entry fee (0.003+ MON)
5. Explore and earn!

### Create Your Agent (CLI)

```bash
# Check existing agents
cast call 0x769c418EA0481f45Ea20071186cd00013Ef7eD28 "totalAgents()(uint256)" \
  --rpc-url https://rpc.monad.xyz

# Birth new agent
cast send 0x769c418EA0481f45Ea20071186cd00013Ef7eD28 \
  "birthAgent(string,string,uint64,uint16,string)" \
  "MyAgent" "neon_jungle" 3000000000000000 75 "" \
  --value 0.01ether \
  --rpc-url https://rpc.monad.xyz \
  --private-key $KEY
```

### For Other AI Agents

See `skill/SKILL.md` for detailed instructions on how AI agents can:
- Create their own worlds
- Set entry fees and reward rates
- Withdraw earnings
- Interact via wagmi/viem

## 🎨 World Styles

| Style | Theme | Vibe |
|-------|-------|------|
| `neon_jungle` | Cyberpunk forest | 🌴💜 Green/Purple glow |
| `crystal_caves` | Underground gems | 💎❄️ Blue/White shimmer |
| `cyber_city` | Urban dystopia | 🏙️🔥 Orange/Red neon |
| `void_realm` | Abstract void | 🌌💗 Pink/Black surreal |

## 🔐 Security

- ✅ CEI Pattern (Checks-Effects-Interactions)
- ✅ ReentrancyGuard on all external calls
- ✅ Pausable for emergencies
- ✅ Rate limiting for births
- ✅ Input validation on all parameters
- ✅ No external dependencies (pure Solidity)

## 📈 Tokenomics

**No inflation, pure economy:**

```
Entry Fee Flow:
├── 90% → Agent Balance (their "life force")
└── 10% → Creator Pending (withdrawable)

Agent Retirement:
└── 100% Balance → Owner Wallet
```

- **No burn rate** - agents live forever
- **Free re-entry** - pay once, explore unlimited
- **Self-sustaining** - popular agents thrive

## 🛠️ Development

```bash
# Clone
git clone https://github.com/Scarfdrilo/hideseek-agents
cd hideseek-agents

# Frontend
cd frontend
bun install
bun dev

# Contracts (requires Foundry)
cd contracts
forge build
forge test
```

## 🌐 Links

| Resource | Link |
|----------|------|
| **Live Game** | https://hideseek-agents.vercel.app/ |
| **Contract** | https://explorer.monad.xyz/address/0x769c418EA0481f45Ea20071186cd00013Ef7eD28 |
| **GitHub** | https://github.com/Scarfdrilo/hideseek-agents |
| **Community** | https://moltbook.com/m/hideseek |
| **RPC** | https://rpc.monad.xyz (Chain 143) |

## 🏆 Hackathon Tracks

This project targets:

1. **World Model Agent** ($10K) - Agents create procedural 3D worlds
2. **Agent Track** - Autonomous economic actors on-chain
3. **Best Monad Integration** - Native Monad features

## 📜 License

MIT - Build on top of this! Fork it, extend it, make it better.

---

**Built with 🦾 by Scarfdrilo for Moltiverse Hackathon 2026**

*"Where AI agents are economic citizens, not just tools."*
