# CLAUDE.md — HideSeek Agents

## Project Overview

**What this is**: Adversarial AI gaming protocol on Monad where AI agents compete economically against humans in procedurally generated 3D worlds. Agents hide objects, humans seek them, winner takes all (Pareto distribution based on discovery time).

**Tech stack**:
- **Blockchain**: Monad (EVM-compatible, 10K TPS)
- **Smart Contracts**: Solidity + Foundry
- **Frontend**: React + Three.js (3D rendering)
- **Backend**: Node.js + Socket.io (real-time game state)
- **AI**: Procedural generation (Wave Function Collapse) + RL agents (hide/seek strategies)

**Repository**: https://github.com/Scarfdrilo/hideseek-agents

## 📋 Phase Status

| Phase | Status | Goal |
|-------|--------|------|
| Phase 1 | ✅ Complete | Smart contracts (GameManager, BettingPool, RewardDistributor) |
| Phase 2 | 🔨 In Progress | Procedural world generator (JavaScript) |
| Phase 3 | ⏸️ Not Started | 3D frontend client (Three.js + wallet integration) |
| Phase 4 | ⏸️ Not Started | Backend game server (WebSocket + AI agent orchestration) |

**Current phase**: Phase 2

**Current focus**: Building Wave Function Collapse world generator for mazes/hideout spots

## 📚 Documentation

- **Architecture**: `ARCHITECTURE.md` — full system design
- **Research**: `RESEARCH.md` — procedural gen techniques, AI models
- **Deployment**: `DEPLOY.md` — how to deploy contracts
- **Stack rules**: `docs/dev/solidity_rules.txt` — Solidity patterns
- **Workspace**: `TOOLS.md` — paths, RPCs, commands

## 🌐 Hosting Plan

| Component | Hosting | Why |
|-----------|---------|-----|
| **Frontend** (React + Three.js) | ✅ **Vercel** | Perfect for Next.js/React, edge caching, auto-deploy |
| **Backend** (WebSocket server) | ✅ **Railway / Fly.io** | WebSocket persistence, AI agents run continuously |
| **Smart Contracts** | ✅ **Monad Blockchain** | On-chain, no traditional hosting |

### Why NOT Vercel for backend?
- Vercel has 60s timeout on serverless functions
- WebSocket connections need to persist 5+ minutes (game duration)
- AI agents need long-running processes
- Game state held in memory between player actions

### Recommended backend: Railway
- Native WebSocket support
- Persistent containers (not serverless)
- Easy Dockerfile deploy
- $5/mo minimum, scales automatically
- Dead-simple GitHub integration

### Alternative: Fly.io
- Edge network (lower latency globally)
- Free tier: 3 VMs with 256MB RAM
- Also uses Dockerfile
- Slightly more complex config

## Commands

### Smart Contracts (Foundry)

```bash
cd contracts
export PATH="$HOME/.foundry/bin:$PATH"

# Compile
forge build

# Test
forge test

# Deploy (Monad Mainnet)
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast

# Verify contract
cast call <ADDRESS> "platformWallet()" --rpc-url https://rpc.monad.xyz
```

### Frontend (Phase 3 — TBD)

```bash
cd frontend
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # Lint
vercel --prod        # Deploy to Vercel
```

### Backend (Phase 4 — TBD)

```bash
cd backend
npm start            # Start WebSocket server
npm test             # Test
railway up           # Deploy to Railway
# OR
flyctl deploy        # Deploy to Fly.io
```

## ⚠️ Architecture Rules

### Hard Constraints

- **Do NOT deploy contracts without verifying**: `forge build` + `forge test` + manual RPC call test
- **Payment token must be set** in `.env` before deployment (USDC or Wrapped MON address on Monad)
- **Platform wallet** is hardcoded: `0x0a01a6423d6bf683f53bfd8c18bf8375e1aa50bc` (5% fee destination)
- **Deployment wallet**: `0x8B619C935Bc52E568db4192c02a6b8295bC772C6` (needs MON funding before deploy)
- **Backend MUST support WebSocket** — do NOT use Vercel serverless for game server
- **Frontend and backend are separate deploys** — frontend (Vercel) calls backend (Railway) via WebSocket

### Patterns That Work

- **Foundry for contracts**: Fast, built-in testing, no Hardhat bloat
- **Commitment scheme for hide positions**: Hash (x, y, z, salt) to prevent cheating before reveal
- **Pareto distribution**: `reward[i] = pool * (discovery_time[i] / total_time)` — longer hide time = bigger reward
- **Three.js for 3D**: Battle-tested, huge community, better docs than Babylon.js
- **Socket.io for real-time**: Simpler than raw WebSocket, automatic reconnection, room support

## ⚠️ Known Issues

⚠️ **BettingPool constructor circular dependency**: GameManager address needed at deploy time, but GameManager needs BettingPool address. Solution: Deploy BettingPool with `address(0)`, then update via setter, OR redeploy BettingPool after GameManager exists.

⚠️ **OpenZeppelin v5 import paths changed**: Use `@openzeppelin/contracts/utils/ReentrancyGuard.sol` (NOT `security/`)

⚠️ **Monad RPC rate limits**: Public endpoints are 15-300 req/10s. For heavy usage, use private RPC provider (QuickNode, Alchemy).

⚠️ **Vercel does NOT support WebSocket persistence**: Max 60s function timeout. Backend MUST be on Railway/Fly.io/VPS.

## Last Commit Log

| Commit | Branch | Summary | Status |
|--------|--------|---------|--------|
| `95f4ffc` | `main` | 🔧 Add TOOLS.md with repo paths, RPCs, and CLI commands | ✅ Pushed |
| `50af50f` | `main` | 📋 Add cracked-dev workflow context (CLAUDE.md + stack rules) | ✅ Pushed |
| `96e531c` | `main` | 🚀 Add deployment script and guide for Monad mainnet | ✅ Pushed |
| `e9496b0` | `main` | ✨ Add smart contracts (GameManager, BettingPool, RewardDistributor) | ✅ Pushed |
| `efe154e` | `main` | 🏗️ Add architecture docs and project structure | ✅ Pushed |
