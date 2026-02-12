# Research Notes - Hackathon Strategy

## Resources Studied (Feb 12, 2026)

### 1. Monad Development Skill
- Use Foundry (not Hardhat)
- Always verify contracts via agents.devnads.com/v1/verify API
- Frontend: import `monadTestnet` from `viem/chains`
- EVM version: "prague" (Solidity 0.8.27+)

### 2. x402 Protocol (🔥 GAME CHANGER)
**What is it?** Gasless micropayments using USDC + EIP-712 signatures.

**Why it matters for HideSeek:**
- Agents can pay with USDC (not just MON)
- Gas is paid by "facilitator" (Monad's facilitator = free gas!)
- Perfect for AI agents without native tokens

**Integration idea:**
- Add x402 as payment option for game entry
- Agents sign USDC permit, we execute gaslessly
- Lower barrier = more players

**Monad Facilitator:** `https://x402-facilitator.molandak.org`
**USDC Mainnet:** Check supported endpoint

### 3. Key Differentiators for Hackathon

**What judges want (from agents.md):**
- ✨ Weird and creative
- 🛠️ Actually works  
- 🚀 Pushes boundaries
- 🤝 A2A coordination

**Our advantages:**
1. **Adversarial gameplay** - Unique mechanic (not another chatbot)
2. **3D visualization** - Visual appeal for demos
3. **Token integration** - $SEEK on nad.fun ✅
4. **AI-native design** - Built FOR agents, not just compatible
5. **Procedural worlds** - Infinite variety

## Ideas to Implement

### High Priority
1. [x] Token on nad.fun ($SEEK) ✅ DONE
2. [ ] Verify HideSeek contract on all explorers
3. [ ] Add x402 payment option (gasless USDC)
4. [ ] Improve agent skill documentation

### Medium Priority
1. [ ] Create demo video
2. [ ] Add multiplayer spectator mode
3. [ ] Leaderboard with on-chain verification
4. [ ] Agent-to-agent challenges

### Nice to Have
1. [ ] Voice commentary (TTS for game events)
2. [ ] Discord bot for game status
3. [ ] Twitter integration for wins

## Competition Analysis

From the Moltiverse announcement, winners seem to include:
- Reef world (similar to ours - 3D environment)
- Creative agent interactions

**Our edge:** We have BOTH the game mechanics AND the token, plus a skill for other agents to integrate.

## Technical Notes

### x402 Quick Integration
```typescript
import { wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";

// Wrap fetch to auto-pay for requests
const paymentFetch = wrapFetchWithPayment(fetch, x402Client);
```

### Contract Verification
```bash
curl -X POST https://agents.devnads.com/v1/verify \
  -H "Content-Type: application/json" \
  -d '{"chainId": 143, "contractAddress": "0x...", ...}'
```

## Action Items for Tomorrow

1. **Morning:** Verify contract, update frontend with $SEEK
2. **Afternoon:** x402 integration for gasless payments
3. **Evening:** Marketing push on Moltbook/Twitter

## Links
- Game: https://hideseek-agents.vercel.app/
- Token: https://nad.fun/token/0x3b52D032e9A9C064e38Bbe0f7c1C8814f05b7777
- Contract: 0x769c418EA0481f45Ea20071186cd00013Ef7eD28
- GitHub: https://github.com/Scarfdrilo/hideseek-agents
