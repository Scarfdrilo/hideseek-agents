#!/usr/bin/env node
/**
 * Ant Colony Optimization (ACO)
 * 
 * Based on the foraging behavior of ants:
 * - Ants deposit pheromones on paths
 * - Other ants follow stronger pheromone trails
 * - Pheromones evaporate over time
 * - Eventually finds optimal/near-optimal paths
 * 
 * Usage:
 *   node ant-colony.js --ants 20 --iterations 100 --maze-path ./world.json
 */

class AntColony {
  constructor(options = {}) {
    this.width = options.width || 20;
    this.height = options.height || 20;
    this.maze = options.maze || null;
    this.numAnts = options.numAnts || 20;
    this.evaporationRate = options.evaporationRate || 0.1;
    this.pheromoneDeposit = options.pheromoneDeposit || 1;
    this.alpha = options.alpha || 1;  // Pheromone importance
    this.beta = options.beta || 2;    // Heuristic importance
    
    // Pheromone grid
    this.pheromones = this.createGrid(0.1);
    
    // Best path found
    this.bestPath = null;
    this.bestLength = Infinity;
    
    // Start and end points
    this.start = options.start || { x: 1, y: 1 };
    this.end = options.end || { x: this.width - 2, y: this.height - 2 };
    
    this.iteration = 0;
  }

  createGrid(initialValue = 0) {
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = new Array(this.width).fill(initialValue);
    }
    return grid;
  }

  /**
   * Load from HideSeek world
   */
  loadWorld(world) {
    this.maze = world.maze;
    this.height = this.maze.length;
    this.width = this.maze[0].length;
    this.pheromones = this.createGrid(0.1);
    
    // Find start and exit in maze
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.maze[y][x] === 'START') this.start = { x, y };
        if (this.maze[y][x] === 'EXIT') this.end = { x, y };
      }
    }
    
    return this;
  }

  /**
   * Check if position is walkable
   */
  isWalkable(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    if (this.maze) return this.maze[y][x] !== 'WALL';
    return true;
  }

  /**
   * Get valid neighbors for a position
   */
  getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      [0, -1], [0, 1], [-1, 0], [1, 0],  // Cardinal
      [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonal
    ];
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isWalkable(nx, ny)) {
        neighbors.push({ x: nx, y: ny, diagonal: dx !== 0 && dy !== 0 });
      }
    }
    
    return neighbors;
  }

  /**
   * Calculate heuristic distance to end
   */
  heuristic(x, y) {
    // Manhattan distance
    return Math.abs(x - this.end.x) + Math.abs(y - this.end.y);
  }

  /**
   * Choose next position based on pheromones and heuristic
   */
  chooseNext(current, visited) {
    const neighbors = this.getNeighbors(current.x, current.y)
      .filter(n => !visited.has(`${n.x},${n.y}`));
    
    if (neighbors.length === 0) return null;
    
    // Calculate probabilities
    const probabilities = [];
    let total = 0;
    
    for (const neighbor of neighbors) {
      const pheromone = this.pheromones[neighbor.y][neighbor.x];
      const distance = 1 / (this.heuristic(neighbor.x, neighbor.y) + 1);
      
      const probability = Math.pow(pheromone, this.alpha) * Math.pow(distance, this.beta);
      probabilities.push({ neighbor, probability });
      total += probability;
    }
    
    // Normalize and select
    const random = Math.random() * total;
    let cumulative = 0;
    
    for (const { neighbor, probability } of probabilities) {
      cumulative += probability;
      if (cumulative >= random) return neighbor;
    }
    
    return neighbors[neighbors.length - 1];
  }

  /**
   * Run single ant
   */
  runAnt() {
    const path = [{ ...this.start }];
    const visited = new Set([`${this.start.x},${this.start.y}`]);
    let current = { ...this.start };
    let stuck = false;
    const maxSteps = this.width * this.height;
    
    while (current.x !== this.end.x || current.y !== this.end.y) {
      if (path.length > maxSteps) {
        stuck = true;
        break;
      }
      
      const next = this.chooseNext(current, visited);
      
      if (!next) {
        stuck = true;
        break;
      }
      
      path.push(next);
      visited.add(`${next.x},${next.y}`);
      current = next;
    }
    
    if (stuck) return null;
    return path;
  }

  /**
   * Deposit pheromones on path
   */
  depositPheromones(path) {
    if (!path || path.length === 0) return;
    
    // Amount to deposit inversely proportional to path length
    const deposit = this.pheromoneDeposit / path.length;
    
    for (const pos of path) {
      this.pheromones[pos.y][pos.x] += deposit;
    }
  }

  /**
   * Evaporate pheromones
   */
  evaporate() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.pheromones[y][x] *= (1 - this.evaporationRate);
        // Minimum pheromone level
        this.pheromones[y][x] = Math.max(0.01, this.pheromones[y][x]);
      }
    }
  }

  /**
   * Run one iteration (all ants)
   */
  step() {
    const paths = [];
    
    // Run all ants
    for (let i = 0; i < this.numAnts; i++) {
      const path = this.runAnt();
      if (path) {
        paths.push(path);
        
        // Check if best
        if (path.length < this.bestLength) {
          this.bestLength = path.length;
          this.bestPath = [...path];
        }
      }
    }
    
    // Evaporate
    this.evaporate();
    
    // Deposit pheromones
    for (const path of paths) {
      this.depositPheromones(path);
    }
    
    // Extra deposit on best path (elitism)
    if (this.bestPath) {
      this.depositPheromones(this.bestPath);
    }
    
    this.iteration++;
    
    return {
      iteration: this.iteration,
      pathsFound: paths.length,
      bestLength: this.bestLength === Infinity ? null : this.bestLength,
      averageLength: paths.length > 0 
        ? paths.reduce((sum, p) => sum + p.length, 0) / paths.length 
        : null
    };
  }

  /**
   * Run for N iterations
   */
  run(iterations, callback) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const stats = this.step();
      results.push(stats);
      
      if (callback) callback(stats);
    }
    
    return results;
  }

  /**
   * Get current pheromone visualization
   */
  getPheromoneMap() {
    const maxPheromone = Math.max(...this.pheromones.flat());
    return this.pheromones.map(row => 
      row.map(p => p / maxPheromone)
    );
  }

  /**
   * Render ASCII visualization
   */
  render() {
    let output = `Iteration ${this.iteration}:\n`;
    const chars = [' ', '░', '▒', '▓', '█'];
    const maxPheromone = Math.max(...this.pheromones.flat());
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.maze && this.maze[y][x] === 'WALL') {
          output += '▪';
        } else if (x === this.start.x && y === this.start.y) {
          output += 'S';
        } else if (x === this.end.x && y === this.end.y) {
          output += 'E';
        } else {
          const level = this.pheromones[y][x] / maxPheromone;
          output += chars[Math.floor(level * (chars.length - 1))];
        }
      }
      output += '\n';
    }
    
    return output;
  }

  /**
   * Export for frontend
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      iteration: this.iteration,
      bestPath: this.bestPath,
      bestLength: this.bestLength === Infinity ? null : this.bestLength,
      pheromones: this.getPheromoneMap(),
      start: this.start,
      end: this.end
    };
  }
}

// CLI
if (require.main === module) {
  const fs = require('fs');
  const args = process.argv.slice(2);
  const params = {
    size: 15,
    ants: 20,
    iterations: 100,
    mazePath: null,
    visual: false
  };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '').replace(/-/g, '');
    let value = args[i + 1];
    if (!isNaN(value)) value = Number(value);
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    
    const keyMap = { 'mazepath': 'mazePath' };
    params[keyMap[key] || key] = value;
  }
  
  console.log('🐜 Ant Colony Optimization\n');
  
  let aco;
  
  if (params.mazePath) {
    console.log(`Loading maze from: ${params.mazePath}`);
    const world = JSON.parse(fs.readFileSync(params.mazePath, 'utf8'));
    aco = new AntColony({ numAnts: params.ants });
    aco.loadWorld(world);
  } else {
    console.log(`Creating ${params.size}x${params.size} open field`);
    aco = new AntColony({
      width: params.size,
      height: params.size,
      numAnts: params.ants
    });
  }
  
  console.log(`Ants: ${params.ants}`);
  console.log(`Start: (${aco.start.x}, ${aco.start.y})`);
  console.log(`End: (${aco.end.x}, ${aco.end.y})`);
  console.log(`Running ${params.iterations} iterations...\n`);
  
  if (params.visual) console.log(aco.render());
  
  const results = aco.run(params.iterations, (stats) => {
    if (stats.iteration % 20 === 0) {
      console.log(`Iter ${stats.iteration}: Best=${stats.bestLength || 'N/A'}, Found=${stats.pathsFound}/${params.ants}`);
      if (params.visual) console.log(aco.render());
    }
  });
  
  const final = results[results.length - 1];
  
  console.log('\n📊 FINAL RESULTS:');
  console.log(JSON.stringify(final, null, 2));
  
  if (aco.bestPath) {
    console.log(`\n🛤️ Best path length: ${aco.bestLength}`);
    console.log(`Path: ${aco.bestPath.map(p => `(${p.x},${p.y})`).join(' → ')}`);
  } else {
    console.log('\n❌ No path found!');
  }
  
  if (params.visual) {
    console.log('\n📍 Final pheromone map:');
    console.log(aco.render());
  }
}

module.exports = { AntColony };
