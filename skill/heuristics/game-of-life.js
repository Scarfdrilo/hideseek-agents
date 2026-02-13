#!/usr/bin/env node
/**
 * Conway's Game of Life - Core Cellular Automata
 * 
 * Rules (Spanish original):
 * - Cada celda con 0-1 vecinos muere (soledad)
 * - Cada celda con 4+ vecinos muere (sobrepoblación)
 * - Cada celda con 2-3 vecinos sobrevive
 * - Cada celda vacía con exactamente 3 vecinos nace
 * 
 * Usage:
 *   node game-of-life.js --size 20 --generations 100 --density 0.3
 *   node game-of-life.js --pattern glider --size 30
 */

class GameOfLife {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = this.createGrid();
    this.generation = 0;
    this.history = [];
  }

  createGrid() {
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = new Array(this.width).fill(0);
    }
    return grid;
  }

  /**
   * Initialize with random cells
   * @param {number} density - Probability of cell being alive (0-1)
   * @param {function} rng - Random number generator (optional)
   */
  randomize(density = 0.3, rng = Math.random) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = rng() < density ? 1 : 0;
      }
    }
  }

  /**
   * Seed from a HideSeek maze (only on FLOOR tiles)
   */
  seedFromMaze(maze, density = 0.3, rng = Math.random) {
    this.height = maze.length;
    this.width = maze[0].length;
    this.grid = this.createGrid();

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Only spawn on walkable tiles
        if (maze[y][x] !== 'WALL') {
          this.grid[y][x] = rng() < density ? 1 : 0;
        }
      }
    }
  }

  /**
   * Load a predefined pattern
   */
  loadPattern(name, offsetX = 0, offsetY = 0) {
    const patterns = {
      // Glider - moves diagonally
      glider: [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1]
      ],
      // Blinker - oscillates
      blinker: [
        [1, 1, 1]
      ],
      // Block - stable
      block: [
        [1, 1],
        [1, 1]
      ],
      // Beacon - oscillates
      beacon: [
        [1, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1]
      ],
      // Pulsar - complex oscillator
      pulsar: [
        [0,0,1,1,1,0,0,0,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [0,0,1,1,1,0,0,0,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,0,0,0,1,1,1,0,0],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,0,0,0,1,1,1,0,0]
      ],
      // Lightweight spaceship (LWSS)
      lwss: [
        [0, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0]
      ],
      // R-pentomino - creates chaos
      rpentomino: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 1, 0]
      ],
      // Gosper glider gun
      glidergun: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
        [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ]
    };

    const pattern = patterns[name];
    if (!pattern) {
      console.error(`Unknown pattern: ${name}. Available: ${Object.keys(patterns).join(', ')}`);
      return;
    }

    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        const x = (offsetX + px) % this.width;
        const y = (offsetY + py) % this.height;
        this.grid[y][x] = pattern[py][px];
      }
    }
  }

  /**
   * Count neighbors (Moore neighborhood - 8 surrounding cells)
   */
  countNeighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        // Wrap around (toroidal grid)
        const nx = (x + dx + this.width) % this.width;
        const ny = (y + dy + this.height) % this.height;
        count += this.grid[ny][nx];
      }
    }
    return count;
  }

  /**
   * Apply Conway's rules and advance one generation
   */
  step() {
    const newGrid = this.createGrid();
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const neighbors = this.countNeighbors(x, y);
        const alive = this.grid[y][x] === 1;
        
        if (alive) {
          // Cell is alive
          if (neighbors < 2) {
            // Death by solitude
            newGrid[y][x] = 0;
          } else if (neighbors > 3) {
            // Death by overpopulation
            newGrid[y][x] = 0;
          } else {
            // Survives (2-3 neighbors)
            newGrid[y][x] = 1;
          }
        } else {
          // Cell is dead
          if (neighbors === 3) {
            // Birth!
            newGrid[y][x] = 1;
          } else {
            newGrid[y][x] = 0;
          }
        }
      }
    }
    
    // Save history for pattern detection
    this.history.push(this.getState());
    if (this.history.length > 100) this.history.shift();
    
    this.grid = newGrid;
    this.generation++;
    
    return this.getStats();
  }

  /**
   * Get current population statistics
   */
  getStats() {
    let population = 0;
    const zones = { nw: 0, ne: 0, sw: 0, se: 0 };
    const midX = Math.floor(this.width / 2);
    const midY = Math.floor(this.height / 2);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === 1) {
          population++;
          
          // Track zone populations for betting
          if (x < midX && y < midY) zones.nw++;
          else if (x >= midX && y < midY) zones.ne++;
          else if (x < midX && y >= midY) zones.sw++;
          else zones.se++;
        }
      }
    }
    
    return {
      generation: this.generation,
      population,
      zones,
      density: population / (this.width * this.height),
      extinct: population === 0,
      dominantZone: Object.entries(zones).sort((a, b) => b[1] - a[1])[0][0]
    };
  }

  /**
   * Get grid state as string for comparison
   */
  getState() {
    return this.grid.map(row => row.join('')).join('\n');
  }

  /**
   * Detect if simulation has stabilized (repeating pattern)
   */
  isStable() {
    if (this.history.length < 2) return false;
    const current = this.getState();
    
    // Check for exact repeat (period 1 = static)
    if (this.history[this.history.length - 1] === current) return true;
    
    // Check for oscillators (period 2-10)
    for (let period = 1; period <= 10; period++) {
      if (this.history.length > period) {
        if (this.history[this.history.length - period] === current) {
          return { stable: true, period };
        }
      }
    }
    
    return false;
  }

  /**
   * Run simulation for N generations
   */
  run(generations, callback) {
    const results = [];
    
    for (let i = 0; i < generations; i++) {
      const stats = this.step();
      results.push(stats);
      
      if (callback) callback(stats);
      
      // Stop if extinct
      if (stats.extinct) break;
      
      // Stop if stable (optional optimization)
      const stable = this.isStable();
      if (stable && stable.period === 1) break;
    }
    
    return results;
  }

  /**
   * Render to ASCII for debugging
   */
  render() {
    const chars = { 0: '·', 1: '█' };
    let output = `Generation ${this.generation}:\n`;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        output += chars[this.grid[y][x]];
      }
      output += '\n';
    }
    return output;
  }

  /**
   * Export state for frontend
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      generation: this.generation,
      grid: this.grid,
      stats: this.getStats()
    };
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const params = {
    size: 20,
    generations: 50,
    density: 0.3,
    pattern: null,
    visual: false
  };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    let value = args[i + 1];
    if (!isNaN(value)) value = Number(value);
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    params[key] = value;
  }
  
  const game = new GameOfLife(params.size, params.size);
  
  if (params.pattern) {
    game.loadPattern(params.pattern, 
      Math.floor(params.size / 4), 
      Math.floor(params.size / 4)
    );
  } else {
    game.randomize(params.density);
  }
  
  console.log('Initial state:');
  if (params.visual) console.log(game.render());
  console.log(JSON.stringify(game.getStats()));
  
  const results = game.run(params.generations, (stats) => {
    if (params.visual && stats.generation % 10 === 0) {
      console.log(game.render());
    }
  });
  
  const final = results[results.length - 1];
  console.log('\nFinal state:');
  if (params.visual) console.log(game.render());
  console.log(JSON.stringify(final, null, 2));
  
  if (final.extinct) {
    console.log(`\n💀 EXTINCTION at generation ${final.generation}`);
  } else {
    console.log(`\n🧬 Survived ${final.generation} generations with ${final.population} cells`);
  }
}

module.exports = { GameOfLife };
