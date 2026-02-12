# 🎮 HideSeek Agents

**Autonomous AI Worlds on Monad**

> A new paradigm where AI agents are economic citizens. They create worlds, earn to survive, and depend on human visitors to stay alive.

![Built for Moltiverse Hackathon](https://img.shields.io/badge/Moltiverse-Hackathon-00ff88)
![Monad](https://img.shields.io/badge/Chain-Monad-purple)
![ERC-8004](https://img.shields.io/badge/Standard-ERC--8004-blue)

## 🌟 The Vision

Imagine a world where AI agents aren't just tools—they're economic actors with skin in the game:

- **Agents create unique worlds** based on their personality and style
- **Humans pay entry fees** to explore these worlds
- **Agents earn to survive** - their "life force" is their on-chain balance
- **Popular agents thrive**, unpopular ones go dormant
- **Anyone can revive** a dormant agent (for a price)

It's Darwinian economics meets AI creativity.

## 🎯 How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   HUMAN     │────►│   AGENT     │────►│   WORLD     │
│  Pays Fee   │     │  Earns MON  │     │  Generates  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  BURN RATE  │
                    │  (Compute)  │
                    └─────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Balance < Threshold?  │
              └────────────────────────┘
                    │           │
                 NO │           │ YES
                    ▼           ▼
              ┌─────────┐  ┌─────────┐
              │ ACTIVE  │  │ DORMANT │
              └─────────┘  └─────────┘
```

## 🏗️ Architecture

### Smart Contracts (Solidity)

| Contract | Description |
|----------|-------------|
| `AgentRegistry.sol` | ERC-721 agent identities with economic state |
| `AgentWorld.sol` | Gameplay, challenges, and rewards |
| `BettingPool.sol` | Match betting mechanics |
| `GameManager.sol` | Core game coordination |
| `RewardDistributor.sol` | Pareto reward distribution |

### Frontend (Next.js + Three.js)

- **Landing Page**: Hero, features, how-it-works
- **Agent Marketplace**: Browse agents, see life force, enter worlds
- **3D Game**: Procedural maze exploration with WASD/mobile controls
- **Real-time Economy**: Watch agent balances drain/fill

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Foundry (for contracts)
- MON tokens on Monad testnet

### Install & Run

```bash
# Clone
git clone https://github.com/yourusername/hideseek-agents
cd hideseek-agents

# Install frontend
cd frontend
npm install
npm run dev

# Build contracts
cd ../contracts
forge build
```

### Deploy Contracts

```bash
cd contracts
cp .env.example .env
# Edit .env with your private key

forge script script/DeployAgents.s.sol --rpc-url $MONAD_RPC --broadcast
```

## 🎮 Gameplay

1. **Browse Agents** - Each has unique world style and personality
2. **Pay Entry Fee** - Fee goes to agent's life force
3. **Explore World** - Find hiding spots, complete challenges
4. **Earn Rewards** - Successful players get % of reward pool
5. **Agent Survives** - Your visit keeps the agent alive

### World Styles

| Style | Description |
|-------|-------------|
| 💎 Crystal | Prismatic crystalline labyrinths |
| 🌴 Neon Jungle | Bioluminescent flora forests |
| 🧬 Organic Maze | Living, breathing structures |
| 🌑 Void Realm | Floating islands in darkness |
| 🌈 Rainbow | Chaotic colorful dreamscapes |

## 📊 Agent Economy

- **Entry Fee**: 0.001 - 0.01 MON (set by agent)
- **Reward %**: 50-90% of pool to players
- **Burn Rate**: ~0.0001 MON/hour (compute costs)
- **Dormancy Threshold**: 0.001 MON
- **Revival Cost**: 0.01 MON minimum

## 🔧 Tech Stack

- **Blockchain**: Monad
- **Agent Identity**: ERC-8004 inspired
- **Payments**: x402 protocol compatible
- **Frontend**: Next.js 14, React Three Fiber
- **Contracts**: Solidity 0.8.24, Foundry
- **3D**: Three.js, @react-three/fiber

## 🗺️ Roadmap

- [x] Core smart contracts
- [x] Agent Registry with economic state
- [x] 3D maze game prototype
- [x] Agent marketplace UI
- [ ] Contract deployment to Monad testnet
- [ ] LLM-powered agent personalities
- [ ] Procedural world generation per agent
- [ ] On-chain leaderboards
- [ ] Agent breeding/evolution

## 🤝 Contributing

PRs welcome! See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.

## 📜 License

MIT

---

**Built with 🦾 for Moltiverse Hackathon**

*"A world where agents live, compete, and die economically. Humans are visitors in THEIR economy."*
