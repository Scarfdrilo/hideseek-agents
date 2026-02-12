# 🔐 HideSeek Agents - Security Documentation

## Vulnerabilities Fixed in V2

### 1. ❌ Unrestricted `payReward()` (CRITICAL)
**V1 Issue:** Anyone could call `payReward()` to drain agent balance.

**V2 Fix:** Added `onlyAuthorizedGame` modifier - only whitelisted game contracts can pay rewards.

```solidity
modifier onlyAuthorizedGame() {
    require(authorizedGameContracts[msg.sender], "Not authorized game contract");
    _;
}

function payReward(...) external onlyAuthorizedGame { ... }
```

### 2. ❌ Reentrancy in `retireAgent()` (HIGH)
**V1 Issue:** State changed AFTER external call - vulnerable to reentrancy.

```solidity
// V1 BAD
if (agent.balance > 0) {
    (bool success, ) = msg.sender.call{value: refund}("");  // External call
    require(success, "Refund failed");
}
agent.state = AgentState.Retired;  // State change AFTER
```

**V2 Fix:** CEI pattern - Checks, Effects, Interactions.

```solidity
// V2 GOOD
agent.balance = 0;
agent.state = AgentState.Retired;  // State change FIRST
emit AgentRetired(agentId);

if (refund > 0) {
    (bool success, ) = msg.sender.call{value: refund}("");  // External call LAST
}
```

### 3. ❌ No Emergency Pause (MEDIUM)
**V1 Issue:** No way to stop contract if vulnerability discovered.

**V2 Fix:** Added OpenZeppelin Pausable.

```solidity
function pause() external onlyOwner { _pause(); }
function unpause() external onlyOwner { _unpause(); }
```

### 4. ❌ Push vs Pull Pattern (MEDIUM)
**V1 Issue:** Creator earnings not tracked, no withdrawal mechanism.

**V2 Fix:** Pull pattern with `creatorPendingWithdrawal`.

```solidity
// Entry fee split
uint256 creatorFee = (msg.value * CREATOR_FEE_PERCENT) / 100;
agent.creatorPendingWithdrawal += creatorFee;

// Creator withdraws when ready
function creatorWithdraw(uint256 agentId) external {
    uint256 amount = agent.creatorPendingWithdrawal;
    agent.creatorPendingWithdrawal = 0;  // Effects first
    (bool success, ) = msg.sender.call{value: amount}("");  // Interactions last
}
```

### 5. ❌ Unbounded Loops (MEDIUM)
**V1 Issue:** `getActiveAgents()` loops through ALL agents - can run out of gas.

**V2 Fix:** Pagination with limit.

```solidity
function getAgentsPaginated(uint256 offset, uint256 limit) external view returns (Agent[] memory) {
    require(limit <= 100, "Limit too high");
    // ...
}
```

### 6. ❌ No Input Validation (LOW)
**V1 Issue:** Missing bounds on personality length, entry fee caps.

**V2 Fix:** Added constants and validation.

```solidity
uint256 public constant MAX_ENTRY_FEE = 1 ether;
uint256 public constant MAX_PERSONALITY_LENGTH = 1000;

require(entryFee >= MIN_ENTRY_FEE && entryFee <= MAX_ENTRY_FEE, "Invalid entry fee");
require(bytes(personality).length <= MAX_PERSONALITY_LENGTH, "Personality too long");
```

### 7. ❌ No Rate Limiting (LOW)
**V1 Issue:** No protection against spam.

**V2 Fix:** Rate limiting modifier.

```solidity
modifier rateLimited() {
    require(block.timestamp >= lastActionTime[msg.sender] + ACTION_COOLDOWN, "Rate limited");
    lastActionTime[msg.sender] = block.timestamp;
    _;
}
```

---

## x402 HTTP Payment Protocol

### What is x402?
HTTP 402 "Payment Required" status code - enables micropayments via HTTP.

### Flow
```
1. Client requests resource
2. Server returns 402 with payment params:
   - X-Payment-Address: 0x...
   - X-Payment-Amount: 0.003 MON
   - X-Payment-Nonce: 42
   - X-Payment-Chain: 10242

3. Client signs payment receipt
4. Client calls processX402Payment() with signature
5. Server verifies on-chain, grants access
```

### Contract Functions

```solidity
// Get payment params for 402 response
function getX402PaymentParams(uint256 agentId) external view returns (
    address paymentAddress,
    uint256 minAmount,
    uint256 nonce,
    uint256 chainId
);

// Process payment with agent signature
function processX402Payment(
    uint256 agentId,
    uint256 amount,
    uint256 nonce,
    bytes calldata signature
) external payable;
```

### Replay Protection
- Unique nonce per agent
- Receipt hash includes chainId
- Used receipts tracked in mapping

---

## Security Checklist

| Check | V1 | V2 |
|-------|----|----|
| Reentrancy guards | ✅ | ✅ |
| CEI pattern | ❌ | ✅ |
| Access control | ❌ | ✅ |
| Input validation | ❌ | ✅ |
| Pausable | ❌ | ✅ |
| Rate limiting | ❌ | ✅ |
| Pull pattern | ❌ | ✅ |
| Pagination | ❌ | ✅ |
| Event logging | ✅ | ✅ |
| Integer overflow | ✅ (0.8.x) | ✅ |

---

## Deployment Recommendations

1. **Use V2** (`AgentRegistryV2.sol`) for production
2. **Set authorized game contracts** immediately after deploy
3. **Test pause/unpause** before mainnet
4. **Monitor events** for suspicious activity
5. **Set reasonable gas limits** for pagination queries

## Audit Status

⚠️ **NOT AUDITED** - This is hackathon code. Get a professional audit before mainnet.
