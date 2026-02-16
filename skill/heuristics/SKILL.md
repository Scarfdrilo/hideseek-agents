# 🧬 HideSeek Heuristics Skill

**Heuristic algorithms for living citizens in your world.**

## Overview

This skill adds LIFE to your HideSeek world. Citizens (cells) evolve using:

1. **Game of Life** - Conway's base rules
2. **Genetic Algorithms** - Natural evolution
3. **Ant Colony** - Collective pathfinding
4. **Simulated Annealing** - Cooling optimization

## Quick Start

```bash
cd skill/heuristics
node game-of-life.js --size 20 --generations 100
node genetic.js --population 50 --generations 200
node citizens.js --maze-path ../worlds/my-world.json
```

## Game of Life Rules (Conway)

```
Each cell has 8 neighbors (Moore neighborhood)

DEATH:
- 0-1 neighbors → dies from loneliness
- 4+ neighbors → dies from overpopulation

SURVIVES:
- 2-3 neighbors → the cell lives

BIRTH:
- Exactly 3 neighbors → empty cell comes alive
```

## Betting Mechanics

Humans can bet on:

| Bet | Description | Odds |
|---------|-------------|------|
| `colony_survival` | Does colony X survive N generations? | 1.5x - 5x |
| `population_at_gen` | How many citizens in generation N? | Variable |
| `dominant_zone` | Which zone has the most citizens? | 2x - 4x |
| `extinction_gen` | In which generation does colony X go extinct? | 3x - 10x |
| `pattern_emerges` | Does a specific pattern appear (glider, etc)? | 5x - 20x |

## Integration with World

```javascript
const { GameOfLife } = require('./game-of-life');
const { Citizens } = require('./citizens');
const world = require('./my-world.json');

// Initialize citizens on floor tiles
const citizens = new Citizens(world.maze);
citizens.seed(0.3); // 30% of floors get citizens

// Run generations
for (let gen = 0; gen < 100; gen++) {
  citizens.step();
  const stats = citizens.getStats();
  console.log(`Gen ${gen}: ${stats.population} citizens`);
}
```

## Files

| File | Purpose |
|------|---------|
| `game-of-life.js` | Core cellular automata |
| `genetic.js` | Evolutionary algorithms |
| `ant-colony.js` | ACO pathfinding |
| `simulated-annealing.js` | SA optimization |
| `citizens.js` | Combined system for worlds |

## Revenue Model

```
World Owner (Agent) gets:
├── 5% of all bets placed in their world
├── 10% if citizen they "adopted" wins
└── Rare NFT drops for unique patterns

Bettors:
├── Win odds based on difficulty
├── Bonus for early correct predictions
└── Streaks multiply winnings
```

---

*Life finds a way. So do profits.* 🧬
