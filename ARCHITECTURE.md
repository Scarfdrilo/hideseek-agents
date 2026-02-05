# 🏗️ Architecture: HideSeek Agents

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Web3)                        │
│  • Game Client (3D Renderer)                                │
│  • Wallet Integration (MetaMask/WalletConnect)              │
│  • Real-time Game State Updates                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GAME SERVER (Node.js)                    │
│  • WebSocket Server (real-time movement)                    │
│  • AI Agent Orchestration                                   │
│  • World Generation Coordinator                             │
│  • State Synchronization                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌─────────────────────────────┐
│   AI AGENTS LAYER        │  │   MONAD BLOCKCHAIN          │
│                          │  │                             │
│  World Architects:       │  │  Smart Contracts:           │
│  • Procedural Gen Models │  │  • GameManager.sol          │
│  • Level Mutation Engine │  │  • BettingPool.sol          │
│  • Difficulty Balancer   │  │  • AgentTreasury.sol        │
│                          │  │  • RewardDistributor.sol    │
│  Adversarial Players:    │  │                             │
│  • Hide Strategy Model   │  │  On-chain Tracking:         │
│  • Seek Strategy Model   │  │  • Player movements         │
│  • Betting Strategy AI   │  │  • Discovery timestamps     │
│  • Learning from history │  │  • Bet resolution           │
└──────────────────────────┘  └─────────────────────────────┘
```

---

## Component Breakdown

### 1. Frontend (3D Game Client)

**Tech:**
- Three.js / Babylon.js (3D rendering)
- React + Vite
- Ethers.js / Wagmi (Web3 interaction)
- WebSocket client (real-time updates)

**Features:**
- First-person 3D navigation
- Real-time world rendering
- Wallet connection & betting UI
- Leaderboard & agent stats
- Match history

---

### 2. Game Server

**Tech:**
- Node.js + Express
- Socket.io (WebSocket)
- Redis (state caching)
- PostgreSQL (match history, analytics)

**Responsibilities:**
- Coordinate AI agents & players
- Stream world updates from World Architects
- Validate movements before blockchain commit
- Batch state updates to Monad (gas optimization)
- Handle AI agent decision-making loops

---

### 3. AI Agents Layer

#### World Architects
**Purpose:** Generate & mutate 3D environments procedurally

**Model Stack:**
- **Base Generation:** Inspired by Google's Genie / Meta's LingBot
  - Input: Text prompt or seed (e.g., "maze with multiple floors")
  - Output: 3D voxel map or mesh coordinates
  
**Tech Options:**
- **Option A (Fast MVP):** Rule-based procedural gen (Wave Function Collapse, Perlin Noise)
- **Option B (AI-driven):** Fine-tuned diffusion models for 3D scenes
  - Models to explore: 
    - ShapE (OpenAI's 3D generation)
    - Point-E
    - Custom trained on Minecraft/voxel datasets

**Mutation Engine:**
- Agents adjust world complexity based on:
  - Average discovery time (too easy → add complexity)
  - Player skill level
  - Historical betting patterns

#### Adversarial Players
**Purpose:** Compete economically against humans

**Models:**
- **Hide Strategy:** RL model (PPO/DQN) trained to:
  - Pick optimal hiding spots
  - Predict human search patterns
  - Maximize discovery time
  
- **Seek Strategy:** Vision + pathfinding model:
  - Analyze world layout
  - Prioritize high-probability zones
  - Learn from previous finds

**Betting Strategy:**
- Kelly Criterion-based bet sizing
- Historical win rate analysis
- Risk-adjusted treasury management

---

### 4. Monad Smart Contracts

#### GameManager.sol
- Register players & agents
- Initialize matches
- Emit events for frontend sync

#### BettingPool.sol
- Accept USDC/MON bets
- Lock funds during match
- Trigger reward distribution on match end

#### AgentTreasury.sol
- Agent-owned wallets
- Autonomous betting approval
- Treasury rebalancing logic

#### RewardDistributor.sol
- Pareto distribution algorithm:
  ```
  reward[i] = pool * (discovery_time[i] / total_time) ^ alpha
  ```
- Platform fee extraction (5%)
- Winner payouts

---

## Data Flow: Hide & Seek Round

```
1. Match Init
   Player/Agent → BettingPool.deposit(amount)
   GameManager.startMatch(worldSeed)

2. World Generation
   WorldArchitect → generates 3D map
   → sends to GameServer → streams to clients

3. Hide Phase (60s)
   Hider → picks spot in 3D world
   GameServer → validates position
   → commits hash to Monad (prevents cheating)

4. Seek Phase (5min)
   Seekers → navigate world
   GameServer → tracks movements
   → first to find → GameServer.reportDiscovery()
   → Monad validates timestamp

5. Resolution
   RewardDistributor.distribute()
   → Pareto calculation
   → 5% to 0x0a01a6423d6bf683f53bfd8c18bf8375e1aa50bc
   → rest to winners
```

---

## Tech Stack Summary

| Layer | Tech |
|-------|------|
| Frontend | React, Three.js, Wagmi |
| Backend | Node.js, Socket.io, Redis |
| AI Models | ShapE/Point-E (worlds), PPO (strategy) |
| Blockchain | Monad, Solidity |
| Database | PostgreSQL (analytics) |
| Hosting | Vercel (frontend), Railway/Fly.io (backend) |

---

## MVP Scope (Hackathon)

**Week 1:**
- [ ] Basic smart contracts (betting, rewards)
- [ ] Simple procedural world gen (no AI, just rules)
- [ ] 3D client with movement
- [ ] WebSocket sync
- [ ] One AI agent (random hide/seek)

**Nice-to-have:**
- [ ] AI-driven world generation
- [ ] Learning agents (RL training)
- [ ] Multiple world types
- [ ] Leaderboard & analytics
