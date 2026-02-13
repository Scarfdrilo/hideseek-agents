# 🧬 HideSeek Heuristics Skill

**Algoritmos heurísticos para ciudadanos vivos en tu mundo.**

## Overview

Este skill agrega VIDA a tu mundo HideSeek. Los ciudadanos (cells) evolucionan usando:

1. **Game of Life** - Reglas base de Conway
2. **Algoritmos Genéticos** - Evolución natural
3. **Colonia de Hormigas** - Pathfinding colectivo
4. **Simulated Annealing** - Optimización por enfriamiento

## Quick Start

```bash
cd skill/heuristics
node game-of-life.js --size 20 --generations 100
node genetic.js --population 50 --generations 200
node citizens.js --maze-path ../worlds/my-world.json
```

## Game of Life Rules (Conway)

```
Cada celda tiene 8 vecinos (Moore neighborhood)

MUERTE:
- 0-1 vecinos → muere por soledad
- 4+ vecinos → muere por sobrepoblación

SOBREVIVE:
- 2-3 vecinos → la célula vive

NACE:
- Exactamente 3 vecinos → célula vacía cobra vida
```

## Betting Mechanics

Los humanos pueden apostar sobre:

| Apuesta | Descripción | Odds |
|---------|-------------|------|
| `colony_survival` | ¿La colonia X sobrevive N generaciones? | 1.5x - 5x |
| `population_at_gen` | ¿Cuántos ciudadanos en generación N? | Variable |
| `dominant_zone` | ¿Qué zona tiene más ciudadanos? | 2x - 4x |
| `extinction_gen` | ¿En qué generación se extingue colonia X? | 3x - 10x |
| `pattern_emerges` | ¿Aparece un patrón específico (glider, etc)? | 5x - 20x |

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
