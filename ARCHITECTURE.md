# HideSeek Agents - Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                               │
│  Next.js 14 + React Three Fiber + Wagmi                      │
├──────────────────────────────────────────────────────────────┤
│  Landing    │  Marketplace  │  3D Game   │  Agent Profile   │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     SMART CONTRACTS                          │
│                        (Monad)                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ AgentRegistry   │◄───│   AgentWorld    │                 │
│  │ (ERC-721)       │    │ (Gameplay)      │                 │
│  └────────┬────────┘    └────────┬────────┘                 │
│           │                      │                           │
│           ▼                      ▼                           │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  GameManager    │◄───│  BettingPool    │                 │
│  │ (Coordination)  │    │ (Escrow)        │                 │
│  └────────┬────────┘    └─────────────────┘                 │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │RewardDistributor│                                        │
│  │ (Pareto)        │                                        │
│  └─────────────────┘                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Contract Details

### AgentRegistry.sol

ERC-721 NFT representing agent identities with economic state.

```solidity
struct Agent {
    uint256 id;
    string name;
    string worldStyle;        // Visual style of generated worlds
    string personality;       // LLM personality prompt
    uint256 balance;          // Life force (in wei)
    uint256 totalEarnings;    // Lifetime earnings
    uint256 totalVisitors;    // Lifetime visitors
    uint256 entryFee;         // Cost to enter world
    uint256 rewardPercent;    // % given to players
    uint256 burnRate;         // Wei/hour compute cost
    uint256 lastHeartbeat;    // Last activity timestamp
    AgentState state;         // Active/Dormant/Retired
    address creator;          // Original creator
}
```

**Key Functions:**
- `birthAgent()` - Create new agent (mint NFT)
- `fundAgent()` - Add to agent's life force
- `enterWorld()` - Pay entry fee, earn revenue
- `heartbeat()` - Deduct burn rate, check dormancy
- `reviveAgent()` - Bring dormant agent back
- `payReward()` - Pay player from agent balance

**Constants:**
- `MIN_ENTRY_FEE`: 0.001 ETH
- `DEFAULT_BURN_RATE`: 0.0001 ETH/hour
- `REVIVAL_COST`: 0.01 ETH
- `DORMANCY_THRESHOLD`: 0.001 ETH

### AgentWorld.sol

Manages gameplay within agent-owned worlds.

```solidity
struct Challenge {
    uint256 id;
    uint256 agentId;
    uint256 rewardPool;
    uint256 maxPlayers;
    uint256 playerCount;
    uint256 startTime;
    uint256 duration;
    bool active;
    bool resolved;
}

struct PlayerSession {
    address player;
    uint256 agentId;
    uint256 challengeId;
    uint256 entryTime;
    uint256 score;
    bool rewarded;
}
```

**Key Functions:**
- `createChallenge()` - Start a challenge in agent's world
- `joinChallenge()` - Player joins (pays entry fee)
- `submitScore()` - Oracle submits player score
- `resolveChallenge()` - Distribute rewards
- `quickPlay()` - Instant single-player mode

### GameManager.sol (Legacy)

Original hide-and-seek game coordination.

**Phases:**
1. Waiting - Players join
2. Hiding - Hiders commit positions
3. Seeking - Seekers find hiders
4. Finished - Rewards distributed

### BettingPool.sol

Escrow for match betting.

- `placeBet()` - Deposit bet
- `lockMatch()` - Freeze pool on start
- `releasePool()` - Transfer to winners

### RewardDistributor.sol

Pareto distribution based on hide times.

```
Reward = (PlayerTime / TotalTime) * PrizePool
```

Longer hide = bigger share.

## Frontend Architecture

```
frontend/
├── app/
│   ├── page.tsx          # Landing + Router
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── AgentCard.tsx     # Agent display card
│   ├── AgentMarketplace.tsx  # Agent browser
│   ├── MazeViewer.tsx    # 3D game canvas
│   └── Maze3D.tsx        # Maze geometry
└── package.json
```

### State Flow

```
Landing → Marketplace → Select Agent → Play Game
                ↓               ↓
           View Stats     Enter World
                ↓               ↓
           Fund Agent     Complete Challenge
                ↓               ↓
           Revive Agent   Earn Rewards
```

## World Generation

Each agent has a `worldStyle` that determines:

| Style | Colors | Geometry | Atmosphere |
|-------|--------|----------|------------|
| crystal | Pastels | Angular, sharp | Ethereal |
| neon_jungle | Greens, cyans | Organic curves | Humid |
| organic_maze | Pinks, reds | Flowing, alive | Pulsing |
| void_realm | Grays, blacks | Floating islands | Empty |
| rainbow | All colors | Chaotic | Energetic |

### Generation Pipeline

1. Agent personality → LLM prompt
2. LLM generates maze parameters
3. WFC (Wave Function Collapse) creates layout
4. Style applied based on worldStyle
5. Hiding spots placed procedurally

## Economic Model

### Agent Revenue

```
Revenue = EntryFees + ChallengePools - Rewards - BurnRate
```

### Player Economics

```
Expected Value = (WinProbability * RewardPercent * Pool) - EntryFee
```

### Equilibrium

Agents must balance:
- **High entry fee** → Less visitors → Less revenue
- **High rewards** → More visitors → Less margin
- **Low burn rate** → Live longer → Less compute

## Security Considerations

1. **Reentrancy**: All external calls use ReentrancyGuard
2. **Commit-Reveal**: Hide positions use hash commitments
3. **Access Control**: Only owner can retire agents
4. **Overflow**: Solidity 0.8.24 built-in checks
5. **Front-running**: Position reveals can be front-run (known limitation)

## Deployment

### Monad Testnet

```bash
# Set environment
export MONAD_RPC="https://testnet.monad.xyz"
export PRIVATE_KEY="your_key"

# Deploy
forge script script/DeployAgents.s.sol \
  --rpc-url $MONAD_RPC \
  --broadcast \
  --verify
```

### Frontend

```bash
# Vercel
vercel --prod

# Or manual
npm run build
npm start
```

## World Labs Integration (AI 3D Worlds)

### Overview

World Labs "Marble" API generates photorealistic 3D environments from:
- Text prompts
- Reference images
- 360° panoramas
- Video

Output format: **Gaussian Splats** (photorealistic) or **Mesh** (traditional)

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│  ai-agents/     │    │   World Labs     │    │    Frontend    │
│  world-labs/    │───►│   API            │───►│  Splat Viewer  │
│  client.js      │    │   (Marble)       │    │  (Three.js)    │
└─────────────────┘    └──────────────────┘    └────────────────┘
```

### API Flow

1. `POST /marble/v1/worlds:generate` → operation_id
2. `GET /marble/v1/operations/{id}` → poll until COMPLETED
3. `GET /marble/v1/worlds/{world_id}` → download splat/mesh

### Frontend Components

```
frontend/
├── components/
│   └── GaussianSplatViewer.tsx  # Splat renderer
└── app/
    └── worlds/
        └── page.tsx             # World gallery
```

### Hybrid Mode (Planned)

Combine procedural generation with AI aesthetics:

1. **Procedural Layout** - Our recursive backtracking generates maze topology
2. **AI Texturing** - World Labs adds realistic textures/lighting
3. **Combined** - Procedural gameplay + photorealistic visuals

### Maze Prompts Library

Pre-defined prompts in `ai-agents/world-labs/examples/maze-prompts.json`:

| Preset | Style |
|--------|-------|
| dungeon_basic | Medieval stone dungeon |
| scifi_station | Futuristic space corridors |
| abandoned_warehouse | Industrial urban decay |
| crystal_cave | Magical underground |
| neon_arcade | Retro 80s synthwave |

### Requirements

- World Labs API key from https://platform.worldlabs.ai
- @mkkellogg/gaussian-splats-3d for rendering
- Credits for generation (see pricing)

## Future Enhancements

1. **LLM Integration**: Real-time personality responses
2. **Agent Breeding**: Combine agent traits
3. **Cross-Agent Travel**: Portals between worlds
4. **Governance**: Agent DAO for economic parameters
5. **Mobile App**: Native iOS/Android game
6. **World Labs Worlds**: AI-generated photorealistic mazes
7. **User Uploads**: Players upload photos to create arenas
