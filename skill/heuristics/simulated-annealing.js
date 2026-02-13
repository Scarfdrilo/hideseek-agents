#!/usr/bin/env node
/**
 * Simulated Annealing (SA)
 * 
 * Inspired by metallurgy:
 * - Start at high "temperature" (accept worse solutions)
 * - Gradually cool down (become more selective)
 * - Sometimes accept worse solutions to escape local optima
 * - Eventually converge to global optimum
 * 
 * Usage:
 *   node simulated-annealing.js --problem tsp --cities 20
 *   node simulated-annealing.js --problem maze --maze-path ./world.json
 */

class SimulatedAnnealing {
  constructor(options = {}) {
    this.initialTemp = options.initialTemp || 1000;
    this.minTemp = options.minTemp || 0.001;
    this.coolingRate = options.coolingRate || 0.995;
    this.temperature = this.initialTemp;
    
    this.currentSolution = null;
    this.currentEnergy = Infinity;
    this.bestSolution = null;
    this.bestEnergy = Infinity;
    
    this.iteration = 0;
    this.history = [];
    
    // Problem-specific functions
    this.generateNeighbor = options.generateNeighbor || this.defaultNeighbor;
    this.calculateEnergy = options.calculateEnergy || this.defaultEnergy;
    this.copySolution = options.copySolution || (s => JSON.parse(JSON.stringify(s)));
  }

  /**
   * Default neighbor function (random swap for arrays)
   */
  defaultNeighbor(solution) {
    const newSolution = [...solution];
    const i = Math.floor(Math.random() * solution.length);
    let j = Math.floor(Math.random() * solution.length);
    while (j === i) j = Math.floor(Math.random() * solution.length);
    [newSolution[i], newSolution[j]] = [newSolution[j], newSolution[i]];
    return newSolution;
  }

  /**
   * Default energy function (sum of values)
   */
  defaultEnergy(solution) {
    return solution.reduce((sum, val) => sum + val, 0);
  }

  /**
   * Initialize with a solution
   */
  initialize(solution) {
    this.currentSolution = this.copySolution(solution);
    this.currentEnergy = this.calculateEnergy(this.currentSolution);
    this.bestSolution = this.copySolution(solution);
    this.bestEnergy = this.currentEnergy;
    this.temperature = this.initialTemp;
    this.iteration = 0;
    return this;
  }

  /**
   * Calculate acceptance probability
   */
  acceptanceProbability(currentEnergy, newEnergy) {
    if (newEnergy < currentEnergy) return 1.0;
    return Math.exp((currentEnergy - newEnergy) / this.temperature);
  }

  /**
   * Run one step
   */
  step() {
    // Generate neighbor
    const neighbor = this.generateNeighbor(this.currentSolution);
    const neighborEnergy = this.calculateEnergy(neighbor);
    
    // Decide if we accept the neighbor
    const ap = this.acceptanceProbability(this.currentEnergy, neighborEnergy);
    const accepted = Math.random() < ap;
    
    if (accepted) {
      this.currentSolution = neighbor;
      this.currentEnergy = neighborEnergy;
      
      // Update best if improved
      if (neighborEnergy < this.bestEnergy) {
        this.bestSolution = this.copySolution(neighbor);
        this.bestEnergy = neighborEnergy;
      }
    }
    
    // Cool down
    this.temperature *= this.coolingRate;
    this.iteration++;
    
    const stats = {
      iteration: this.iteration,
      temperature: this.temperature,
      currentEnergy: this.currentEnergy,
      bestEnergy: this.bestEnergy,
      accepted
    };
    
    this.history.push(stats);
    return stats;
  }

  /**
   * Run until cooled down
   */
  run(callback) {
    const results = [];
    
    while (this.temperature > this.minTemp) {
      const stats = this.step();
      results.push(stats);
      
      if (callback) callback(stats);
    }
    
    return results;
  }

  /**
   * Run for fixed iterations
   */
  runIterations(iterations, callback) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const stats = this.step();
      results.push(stats);
      
      if (callback) callback(stats);
      
      if (this.temperature <= this.minTemp) break;
    }
    
    return results;
  }

  /**
   * Export results
   */
  toJSON() {
    return {
      iteration: this.iteration,
      temperature: this.temperature,
      currentSolution: this.currentSolution,
      currentEnergy: this.currentEnergy,
      bestSolution: this.bestSolution,
      bestEnergy: this.bestEnergy,
      improvement: ((this.history[0]?.currentEnergy || this.bestEnergy) - this.bestEnergy) / (this.history[0]?.currentEnergy || 1)
    };
  }
}

/**
 * Traveling Salesman Problem solver using SA
 */
class TSPSolver {
  constructor(cities) {
    this.cities = cities;
    this.n = cities.length;
    
    // Pre-calculate distances
    this.distances = [];
    for (let i = 0; i < this.n; i++) {
      this.distances[i] = [];
      for (let j = 0; j < this.n; j++) {
        this.distances[i][j] = this.distance(cities[i], cities[j]);
      }
    }
    
    this.sa = new SimulatedAnnealing({
      generateNeighbor: this.generateNeighbor.bind(this),
      calculateEnergy: this.calculateEnergy.bind(this)
    });
  }

  distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  /**
   * Generate neighbor by 2-opt (reverse a segment)
   */
  generateNeighbor(tour) {
    const newTour = [...tour];
    let i = Math.floor(Math.random() * (this.n - 1));
    let j = Math.floor(Math.random() * (this.n - i - 1)) + i + 1;
    
    // Reverse segment between i and j
    while (i < j) {
      [newTour[i], newTour[j]] = [newTour[j], newTour[i]];
      i++;
      j--;
    }
    
    return newTour;
  }

  /**
   * Calculate total tour length
   */
  calculateEnergy(tour) {
    let total = 0;
    for (let i = 0; i < this.n; i++) {
      total += this.distances[tour[i]][tour[(i + 1) % this.n]];
    }
    return total;
  }

  /**
   * Create initial random tour
   */
  createInitialTour() {
    const tour = Array.from({ length: this.n }, (_, i) => i);
    // Shuffle
    for (let i = this.n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tour[i], tour[j]] = [tour[j], tour[i]];
    }
    return tour;
  }

  /**
   * Solve TSP
   */
  solve(callback) {
    const initialTour = this.createInitialTour();
    this.sa.initialize(initialTour);
    return this.sa.run(callback);
  }

  /**
   * Get best tour as city coordinates
   */
  getBestTour() {
    if (!this.sa.bestSolution) return null;
    return this.sa.bestSolution.map(i => this.cities[i]);
  }
}

/**
 * Maze path optimizer using SA
 */
class MazeOptimizer {
  constructor(maze, start, end) {
    this.maze = maze;
    this.height = maze.length;
    this.width = maze[0].length;
    this.start = start;
    this.end = end;
    
    this.sa = new SimulatedAnnealing({
      generateNeighbor: this.generateNeighbor.bind(this),
      calculateEnergy: this.calculateEnergy.bind(this),
      copySolution: (path) => path.map(p => ({ ...p }))
    });
  }

  isWalkable(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.maze[y][x] !== 'WALL';
  }

  /**
   * Generate neighbor path by modifying a point
   */
  generateNeighbor(path) {
    const newPath = path.map(p => ({ ...p }));
    
    // Pick a random point (not start or end)
    if (newPath.length <= 2) return newPath;
    
    const idx = Math.floor(Math.random() * (newPath.length - 2)) + 1;
    const point = newPath[idx];
    
    // Try to move it to a neighbor position
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const dir = directions[Math.floor(Math.random() * 4)];
    const newX = point.x + dir[0];
    const newY = point.y + dir[1];
    
    if (this.isWalkable(newX, newY)) {
      newPath[idx] = { x: newX, y: newY };
    }
    
    // Sometimes add or remove a point
    if (Math.random() < 0.1 && newPath.length > 3) {
      // Remove a point
      newPath.splice(idx, 1);
    } else if (Math.random() < 0.1) {
      // Add a point between idx and idx+1
      const next = newPath[idx + 1] || newPath[idx];
      const midX = Math.floor((newPath[idx].x + next.x) / 2);
      const midY = Math.floor((newPath[idx].y + next.y) / 2);
      if (this.isWalkable(midX, midY)) {
        newPath.splice(idx + 1, 0, { x: midX, y: midY });
      }
    }
    
    return newPath;
  }

  /**
   * Calculate path energy (length + penalties)
   */
  calculateEnergy(path) {
    let energy = 0;
    
    // Path length
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      energy += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Penalty for invalid moves (through walls)
    for (let i = 0; i < path.length; i++) {
      if (!this.isWalkable(path[i].x, path[i].y)) {
        energy += 100; // Big penalty
      }
    }
    
    // Penalty for not reaching end
    const lastPoint = path[path.length - 1];
    const distToEnd = Math.abs(lastPoint.x - this.end.x) + Math.abs(lastPoint.y - this.end.y);
    energy += distToEnd * 10;
    
    return energy;
  }

  /**
   * Create initial path (straight line with adjustments)
   */
  createInitialPath() {
    const path = [{ ...this.start }];
    let current = { ...this.start };
    
    while (current.x !== this.end.x || current.y !== this.end.y) {
      const dx = Math.sign(this.end.x - current.x);
      const dy = Math.sign(this.end.y - current.y);
      
      // Try to move towards end
      let moved = false;
      for (const [mx, my] of [[dx, dy], [dx, 0], [0, dy]]) {
        if (mx === 0 && my === 0) continue;
        const nx = current.x + mx;
        const ny = current.y + my;
        if (this.isWalkable(nx, ny)) {
          current = { x: nx, y: ny };
          path.push({ ...current });
          moved = true;
          break;
        }
      }
      
      // If stuck, try random direction
      if (!moved) {
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [mx, my] of dirs) {
          const nx = current.x + mx;
          const ny = current.y + my;
          if (this.isWalkable(nx, ny) && !path.some(p => p.x === nx && p.y === ny)) {
            current = { x: nx, y: ny };
            path.push({ ...current });
            moved = true;
            break;
          }
        }
      }
      
      if (!moved || path.length > this.width * this.height) break;
    }
    
    return path;
  }

  /**
   * Solve maze optimization
   */
  solve(callback) {
    const initialPath = this.createInitialPath();
    this.sa.initialize(initialPath);
    return this.sa.run(callback);
  }

  getBestPath() {
    return this.sa.bestSolution;
  }
}

// CLI
if (require.main === module) {
  const fs = require('fs');
  const args = process.argv.slice(2);
  const params = {
    problem: 'tsp',
    cities: 15,
    mazePath: null,
    temp: 1000,
    cooling: 0.995,
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
  
  console.log('🔥 Simulated Annealing\n');
  
  if (params.problem === 'tsp') {
    // Generate random cities
    const cities = [];
    for (let i = 0; i < params.cities; i++) {
      cities.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        name: `City${i}`
      });
    }
    
    console.log(`Solving TSP with ${params.cities} cities...`);
    
    const solver = new TSPSolver(cities);
    solver.sa.initialTemp = params.temp;
    solver.sa.coolingRate = params.cooling;
    
    const results = solver.solve((stats) => {
      if (stats.iteration % 500 === 0) {
        console.log(`Iter ${stats.iteration}: Temp=${stats.temperature.toFixed(2)}, Best=${stats.bestEnergy.toFixed(2)}`);
      }
    });
    
    const final = solver.sa.toJSON();
    console.log('\n📊 FINAL RESULTS:');
    console.log(`  Iterations: ${final.iteration}`);
    console.log(`  Best tour length: ${final.bestEnergy.toFixed(2)}`);
    console.log(`  Improvement: ${(final.improvement * 100).toFixed(1)}%`);
    
  } else if (params.problem === 'maze' && params.mazePath) {
    console.log(`Optimizing path in maze: ${params.mazePath}`);
    
    const world = JSON.parse(fs.readFileSync(params.mazePath, 'utf8'));
    const maze = world.maze;
    const start = world.start;
    const end = world.exit;
    
    const solver = new MazeOptimizer(maze, start, end);
    solver.sa.initialTemp = params.temp;
    solver.sa.coolingRate = params.cooling;
    
    const results = solver.solve((stats) => {
      if (stats.iteration % 500 === 0) {
        console.log(`Iter ${stats.iteration}: Temp=${stats.temperature.toFixed(2)}, Best=${stats.bestEnergy.toFixed(2)}`);
      }
    });
    
    const bestPath = solver.getBestPath();
    console.log('\n📊 FINAL RESULTS:');
    console.log(`  Path length: ${bestPath?.length || 'N/A'}`);
    console.log(`  Energy: ${solver.sa.bestEnergy.toFixed(2)}`);
    
  } else {
    console.log('Usage:');
    console.log('  node simulated-annealing.js --problem tsp --cities 20');
    console.log('  node simulated-annealing.js --problem maze --maze-path ./world.json');
  }
}

module.exports = { SimulatedAnnealing, TSPSolver, MazeOptimizer };
