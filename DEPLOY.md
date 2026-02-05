# 🚀 Deployment Guide

## Prerequisites

1. **Monad Mainnet MON** sent to deployer wallet:
   - Address: `0x8B619C935Bc52E568db4192c02a6b8295bC772C6`
   - Estimated cost: ~0.01-0.05 MON

2. **Payment Token Address** (USDC or Wrapped MON on Monad)
   - Update `PAYMENT_TOKEN` in `contracts/.env`

## Deployment Steps

### 1. Check balance

```bash
cd contracts
source .env
cast balance $DEPLOYER_ADDRESS --rpc-url $RPC_URL
```

### 2. Deploy contracts

```bash
export PATH="$HOME/.foundry/bin:$PATH"
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### 3. Save deployed addresses

After successful deployment, copy the contract addresses from console output to this file:

- **BettingPool:** `[ADDRESS]`
- **RewardDistributor:** `[ADDRESS]`
- **GameManager:** `[ADDRESS]`

## Verify Contracts (Optional)

If not auto-verified during deployment:

```bash
forge verify-contract \
  <CONTRACT_ADDRESS> \
  <CONTRACT_NAME> \
  --chain-id 143 \
  --constructor-args $(cast abi-encode "constructor(address,address)" <ARG1> <ARG2>)
```

## Post-Deployment

1. Test contract calls:

```bash
# Check GameManager
cast call <GAME_MANAGER_ADDRESS> "platformWallet()" --rpc-url $RPC_URL

# Check BettingPool
cast call <BETTING_POOL_ADDRESS> "paymentToken()" --rpc-url $RPC_URL
```

2. Update frontend config with deployed addresses

3. Register AI agents:

```bash
cast send <GAME_MANAGER_ADDRESS> \
  "registerAgent(address)" \
  <AGENT_WALLET> \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL
```

## Troubleshooting

- **Insufficient funds:** Send more MON to `0x8B619C935Bc52E568db4192c02a6b8295bC772C6`
- **Wrong token address:** Update `PAYMENT_TOKEN` in `.env`
- **RPC timeout:** Try alternate RPC: `https://rpc1.monad.xyz` or `https://rpc2.monad.xyz`
