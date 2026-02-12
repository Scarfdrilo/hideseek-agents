# TOOLS.md — HideSeek Agents Workspace

## Repository

- **GitHub**: https://github.com/Scarfdrilo/hideseek-agents
- **Clone URL**: `git@github.com:Scarfdrilo/hideseek-agents.git`
- **Local path**: `/home/scarf/.openclaw/workspace/hideseek-agents`

## Network Info (Monad Mainnet)

- **Chain ID**: 143
- **RPC URL**: https://rpc.monad.xyz
- **Backup RPCs**:
  - https://rpc1.monad.xyz (Alchemy)
  - https://rpc2.monad.xyz (Goldsky)
  - https://rpc3.monad.xyz (Ankr)
- **Explorer**: https://monadvision.com
- **Currency**: MON

## Deployment

- **Deployer Wallet**: `0x8B619C935Bc52E568db4192c02a6b8295bC772C6`
- **Private Key**: Stored in `contracts/.env` (DO NOT COMMIT)
- **Platform Fee Wallet**: `0x0a01a6423d6bf683f53bfd8c18bf8375e1aa50bc` (5% fee recipient)

## Environment Variables

Located in: `contracts/.env`

```
RPC_URL=https://rpc.monad.xyz
CHAIN_ID=143
PRIVATE_KEY=0x...
PLATFORM_WALLET=0x0a01a6423d6bf683f53bfd8c18bf8375e1aa50bc
PAYMENT_TOKEN=0x... # USDC or Wrapped MON address (TBD)
```

## Git Config

```bash
git config user.name "Pedro Manuel"
git config user.email "pedro-manuel@openclaw.local"
```

## CLI Tools

### Foundry (Smart Contracts)

```bash
export PATH="$HOME/.foundry/bin:$PATH"
forge --version  # v1.5.1-stable
cast --version
```

### GitHub CLI

```bash
gh auth status  # Logged in as Scarfdrilo
gh pr create --base main --title "feat(phase-2): world generator"
```

### Node.js

```bash
node --version  # v24.13.0
npm --version
```

## Useful Commands

### Check deployed contract

```bash
cast call <CONTRACT_ADDRESS> \
  "platformWallet()" \
  --rpc-url https://rpc.monad.xyz
```

### Check wallet balance

```bash
cast balance 0x8B619C935Bc52E568db4192c02a6b8295bC772C6 \
  --rpc-url https://rpc.monad.xyz
```

### Estimate gas for deployment

```bash
forge script script/Deploy.s.sol \
  --rpc-url $RPC_URL \
  --estimate-gas
```

## Directories

```
hideseek-agents/
├── contracts/          # Solidity (Foundry)
│   ├── src/           # Smart contracts
│   ├── script/        # Deployment scripts
│   ├── test/          # Foundry tests
│   └── .env           # Private keys (gitignored)
├── frontend/          # React + Three.js (Phase 3)
├── backend/           # Node.js + Socket.io (Phase 4)
├── ai-agents/         # RL models & procedural gen (Phase 2+)
├── docs/              # Specs & architecture
│   ├── specs/
│   └── dev/           # Stack rules
├── ARCHITECTURE.md    # System design
├── RESEARCH.md        # AI/procedural gen research
├── DEPLOY.md          # Deployment guide
├── CLAUDE.md          # Project context (this gets read first!)
└── TOOLS.md           # This file
```

## Known Tool Issues

⚠️ **Foundry bin path**: Must export `PATH="$HOME/.foundry/bin:$PATH"` in every session

⚠️ **GitHub SSH**: Using `git@github.com:`, not HTTPS

⚠️ **Monad public RPC limits**: 15-300 req/10s depending on endpoint. Use rate limiting or private RPC for heavy use.
