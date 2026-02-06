# 🌍 World Generator - HideSeek Agents

Procedural maze generation for adversarial hide-and-seek gameplay.

## Features

- **Recursive Backtracking Algorithm** — Guarantees fully connected, solvable mazes
- **Smart Hiding Spot Detection** — Automatically identifies dead ends and corners
- **Seeded Generation** — Same seed = same maze (reproducible for matches)
- **Difficulty Scaling** — Easy (3 spots), Medium (5 spots), Hard (8 spots)
- **JSON Export** — Ready for frontend consumption

## Usage

### Basic Example

```javascript
const SimpleMazeGenerator = require('./simple-maze');

const generator = new SimpleMazeGenerator(21, 21, 'medium');
const maze = generator.generate(12345); // Seed for reproducibility

console.log(generator.toASCII());
console.log(JSON.stringify(generator.toJSON(), null, 2));
```

### Run Examples

```bash
npm run example           # Original WFC-based generator
node example-simple.js    # Simplified recursive backtracking
```

## Output Format

### ASCII Visualization

```
#####################
##S........#.#.....##
##.#######.#.#.###.##
##.#...#.#.#.....#.##
##.#.#.#.#.#####.#.##
##...#...#...#...#.##
########.###.#.###H##
```

**Legend:**
- `#` = Wall (impassable)
- `.` = Floor (walkable)
- `H` = Hiding Spot
- `S` = Start Position (seeker spawns here)

### JSON Export

```json
{
  "width": 21,
  "height": 21,
  "difficulty": "medium",
  "maze": [
    ["WALL", "WALL", "WALL", ...],
    ["WALL", "START", "FLOOR", ...]
  ],
  "hidingSpots": [
    { "x": 12, "y": 12, "id": 0 },
    { "x": 5, "y": 18, "id": 1 }
  ]
}
```

## Algorithms

### Simple Maze (Recommended)

**File:** `simple-maze.js`

**Algorithm:** Recursive Backtracking
- Starts from center point
- Randomly chooses directions
- Carves passages recursively
- **Pros:** Fast, always connected, natural-looking mazes
- **Cons:** Can be predictable with same seed

### WFC Maze (Experimental)

**File:** `wfc.js` + `maze-generator.js`

**Algorithm:** Wave Function Collapse
- Tile-based constraint solving
- More flexible tile types
- **Pros:** Highly customizable, supports complex patterns
- **Cons:** Slower, can create contradictions, needs tuning

## Hiding Spot Detection

A good hiding spot has:
- **Dead End:** 3 walls, 1 opening (hardest to find)
- **Corner:** 2 walls, 2 openings (medium difficulty)

The algorithm scans all floor tiles and ranks them by "hidability" — number of adjacent walls.

## Integration with Frontend

The JSON export is designed to work directly with Three.js:

```javascript
fetch('/api/generate-maze')
  .then(res => res.json())
  .then(({ maze, hidingSpots }) => {
    // Render maze with Three.js
    maze.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === 'WALL') {
          addWallCube(x, y);
        } else if (tile === 'HIDING_SPOT') {
          addHidingSpotMarker(x, y);
        }
      });
    });
  });
```

## TODO (Phase 3+)

- [ ] 3D maze generation (multi-floor buildings)
- [ ] Dynamic difficulty adjustment based on player skill
- [ ] AI-driven mutation (agents create harder variants)
- [ ] Pathfinding API for AI seekers
- [ ] Lighting/visibility zones (areas with poor line-of-sight)

## References

- **Recursive Backtracking:** Classic maze algorithm, used in roguelikes
- **Wave Function Collapse:** [mxgmn/WaveFunctionCollapse](https://github.com/mxgmn/WaveFunctionCollapse)
- **Procedural Generation:** See `RESEARCH.md` for more techniques
