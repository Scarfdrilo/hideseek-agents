# 📚 Research Notes: Procedural Generation & AI Models

## Procedural World Generation

### Techniques for 3D Worlds

1. **Wave Function Collapse (WFC)**
   - Tile-based generation
   - Good for structured environments (dungeons, mazes)
   - Fast, deterministic
   - Used in: Bad North, Townscaper

2. **Perlin/Simplex Noise**
   - Terrain generation
   - Natural-looking landscapes
   - Used in: Minecraft

3. **L-Systems (Lindenmayer Systems)**
   - Fractal-based generation
   - Great for organic structures (trees, plants)
   - Can be adapted for architecture

4. **Cellular Automata**
   - Cave generation
   - Organic-looking spaces
   - Simple rules, emergent complexity

### AI-Driven Generation (Cutting Edge)

#### Google Genie
- **Paper:** "Genie: Generative Interactive Environments" (2024)
- **Concept:** Text/image → playable 2D platformer world
- **Tech:** Latent action model + video diffusion
- **Status:** Research only (not open-source)
- **Our Adaptation:** Use similar concept but simpler models

#### Meta LingBot / WorldGen Models
- **Concept:** Language-guided world building
- **Status:** Mostly research papers
- **Alternative:** Use stable diffusion + 3D lifting

#### OpenAI ShapE & Point-E
- **ShapE:** Text → 3D shape generation
- **Point-E:** Text → 3D point clouds
- **Status:** Open-source!
- **Use Case:** Generate 3D objects for hiding spots

## Implementation Plan

### MVP (Week 1): Rule-Based
```javascript
// Pseudocode
class WorldArchitect {
  generateWorld(seed, difficulty) {
    // 1. Generate base grid with WFC
    grid = waveCollapse(seed, TILE_RULES)
    
    // 2. Add hiding spots based on difficulty
    spots = placeHidingSpots(grid, difficulty * 10)
    
    // 3. Ensure all spots are reachable
    validatePathfinding(grid, spots)
    
    return { grid, spots }
  }
}
```

### Future (Post-Hackathon): AI-Driven
- Fine-tune ShapE on voxel datasets
- Train RL agent to generate "hard to find" spots
- Use historical data to evolve difficulty

## AI Agent Strategy Models

### Hide Strategy (Reinforcement Learning)
**Model:** Proximal Policy Optimization (PPO)

**State Space:**
- World layout (voxel grid)
- Historical discovery times for similar spots
- Current player skill level

**Action Space:**
- Choose (x, y, z) coordinate to hide object

**Reward:**
- +1 for each second object stays hidden
- -10 if found in <30s (too easy)

**Training:**
- Self-play against Seek agent
- Curriculum learning (start simple, increase complexity)

### Seek Strategy (Hybrid)
**Model:** Vision Transformer + A* Pathfinding

**Input:**
- First-person view of world
- Memory of previously checked locations

**Output:**
- Next waypoint to check

**Training:**
- Supervised learning on human gameplay
- Fine-tune with RL (reward = speed of discovery)

## Betting Strategy (Kelly Criterion)

```python
def calculate_bet(agent_winrate, treasury_balance, pool_size):
    edge = agent_winrate - 0.5  # advantage over 50/50
    kelly_fraction = edge / (pool_size / treasury_balance)
    
    # Conservative: use 1/2 Kelly to reduce volatility
    bet_amount = treasury_balance * kelly_fraction * 0.5
    
    return min(bet_amount, treasury_balance * 0.1)  # max 10% of treasury
```

## Tech Resources

### 3D Rendering (Frontend)
- **Three.js:** Most popular, huge community
- **Babylon.js:** Better for games, built-in physics
- **PlayCanvas:** WebGL engine, good for multiplayer

### Procedural Gen Libraries
- **rot.js:** Roguelike toolkit (2D, but adaptable)
- **Tiled:** Map editor + export
- **Greedy Meshing:** Voxel optimization (for Minecraft-like worlds)

### AI/ML
- **TensorFlow.js:** Run models in browser
- **ONNX Runtime:** Deploy trained models
- **Stable Baselines3:** RL training (Python)

### Monad Development
- **RPC:** https://testnet.monad.xyz (to be confirmed)
- **Faucet:** TBD
- **EVM Compatible:** Yes (can use Hardhat/Foundry)

## Open Questions

1. **World Complexity:** Start 2D or 3D?
   - **Proposal:** 2.5D (top-down 3D) for MVP
   
2. **AI Model Hosting:** Where to run inference?
   - **Proposal:** Backend server (avoid client-side latency)
   
3. **State Sync:** Full on-chain or hybrid?
   - **Proposal:** Hybrid - movements off-chain, critical events on-chain

4. **Agent Autonomy:** Who controls agent wallets?
   - **Proposal:** Agent-owned EOAs with pre-funded treasury

## Next Steps

- [ ] Prototype WFC world generator (JavaScript)
- [ ] Deploy basic smart contracts to Monad testnet
- [ ] Build 3D client proof-of-concept
- [ ] Train simple hide/seek RL agent (if time)
