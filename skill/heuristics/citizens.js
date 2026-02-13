#!/usr/bin/env node
/**
 * Citizens System - Combines Game of Life + Genetics for HideSeek Worlds
 * 
 * Creates living citizens in your maze that:
 * - Follow Conway's Game of Life rules for birth/death
 * - Have genetic traits that evolve over generations
 * - Can be bet on by humans
 * 
 * Usage:
 *   node citizens.js --world-path ./world.json --generations 100
 *   node citizens.js --size 20 --density 0.3 --generations 50
 */

const { GameOfLife } = require('./game-of-life');
const { GeneticAlgorithm, Citizen } = require('./genetic');

class CitizenWorld {
  constructor(options = {}) {
    this.width = options.width || 20;
    this.height = options.height || 20;
    this.maze = options.maze || null;
    this.generation = 0;
    
    // Cellular automata layer (positions)
    this.gol = new GameOfLife(this.width, this.height);
    
    // Genetic layer (traits)
    this.citizens = new Map(); // position key -> Citizen
    
    // History for betting
    this.history = [];
    this.bets = [];
    
    // Zone definitions for betting
    this.zones = this.defineZones();
  }

  /**
   * Define zones for betting (quadrants + center)
   */
  defineZones() {
    const midX = Math.floor(this.width / 2);
    const midY = Math.floor(this.height / 2);
    const quarterX = Math.floor(this.width / 4);
    const quarterY = Math.floor(this.height / 4);
    
    return {
      nw: { x1: 0, y1: 0, x2: midX, y2: midY, name: 'Northwest' },
      ne: { x1: midX, y1: 0, x2: this.width, y2: midY, name: 'Northeast' },
      sw: { x1: 0, y1: midY, x2: midX, y2: this.height, name: 'Southwest' },
      se: { x1: midX, y1: midY, x2: this.width, y2: this.height, name: 'Southeast' },
      center: { 
        x1: quarterX, y1: quarterY, 
        x2: this.width - quarterX, y2: this.height - quarterY, 
        name: 'Center' 
      }
    };
  }

  /**
   * Initialize from a HideSeek world JSON
   */
  loadWorld(world) {
    this.maze = world.maze;
    this.height = this.maze.length;
    this.width = this.maze[0].length;
    this.gol = new GameOfLife(this.width, this.height);
    this.zones = this.defineZones();
    return this;
  }

  /**
   * Seed initial citizens on the maze
   */
  seed(density = 0.3) {
    if (this.maze) {
      // Only spawn on walkable tiles
      this.gol.seedFromMaze(this.maze, density);
    } else {
      this.gol.randomize(density);
    }
    
    // Create Citizen objects for each living cell
    this.syncCitizensFromGrid();
    
    return this;
  }

  /**
   * Sync Citizen objects with GOL grid positions
   */
  syncCitizensFromGrid() {
    const newCitizens = new Map();
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const key = `${x},${y}`;
        
        if (this.gol.grid[y][x] === 1) {
          // Cell is alive
          if (this.citizens.has(key)) {
            // Existing citizen survives
            const citizen = this.citizens.get(key);
            citizen.age++;
            newCitizens.set(key, citizen);
          } else {
            // New citizen born
            const citizen = new Citizen(null, 5);
            citizen.calculateFitness(this.getLocalEnvironment(x, y));
            newCitizens.set(key, citizen);
          }
        }
      }
    }
    
    this.citizens = newCitizens;
  }

  /**
   * Get local environment for fitness calculation
   */
  getLocalEnvironment(x, y) {
    const neighbors = this.gol.countNeighbors(x, y);
    
    // Check if near special tiles
    let nearSpecial = false;
    if (this.maze) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = (x + dx + this.width) % this.width;
          const ny = (y + dy + this.height) % this.height;
          const tile = this.maze[ny]?.[nx];
          if (tile && !['WALL', 'FLOOR'].includes(tile)) {
            nearSpecial = true;
          }
        }
      }
    }
    
    return {
      predatorDensity: neighbors / 8,
      resourceScarcity: 1 - (neighbors / 8),
      mazeComplexity: nearSpecial ? 0.8 : 0.5
    };
  }

  /**
   * Run one generation
   */
  step() {
    // Save pre-step state
    const preStats = this.getStats();
    
    // Advance GOL
    this.gol.step();
    
    // Sync citizens (handles births/deaths)
    this.syncCitizensFromGrid();
    
    // Evolve surviving citizens (genetic)
    this.evolveCitizens();
    
    this.generation++;
    
    // Get post-step stats
    const postStats = this.getStats();
    
    // Record history
    this.history.push({
      generation: this.generation,
      before: preStats,
      after: postStats,
      births: postStats.population - preStats.population + postStats.deaths,
      deaths: preStats.population - postStats.population + postStats.births
    });
    
    // Check bets
    this.checkBets(postStats);
    
    return postStats;
  }

  /**
   * Evolve citizens using genetic algorithm principles
   */
  evolveCitizens() {
    // Citizens with high fitness are more likely to influence neighbors
    const citizenList = Array.from(this.citizens.values());
    
    for (const citizen of citizenList) {
      // Recalculate fitness
      const [x, y] = this.getCitizenPosition(citizen);
      if (x !== null) {
        citizen.calculateFitness(this.getLocalEnvironment(x, y));
        
        // Small random mutations
        citizen.mutate(0.02, 0.05);
      }
    }
  }

  /**
   * Find position of a citizen
   */
  getCitizenPosition(citizen) {
    for (const [key, c] of this.citizens) {
      if (c.id === citizen.id) {
        const [x, y] = key.split(',').map(Number);
        return [x, y];
      }
    }
    return [null, null];
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    const zoneStats = {};
    let totalFitness = 0;
    let births = 0;
    let deaths = 0;
    
    // Initialize zone stats
    for (const [zoneId, zone] of Object.entries(this.zones)) {
      zoneStats[zoneId] = { population: 0, totalFitness: 0 };
    }
    
    // Count population per zone
    for (const [key, citizen] of this.citizens) {
      const [x, y] = key.split(',').map(Number);
      totalFitness += citizen.fitness;
      
      for (const [zoneId, zone] of Object.entries(this.zones)) {
        if (x >= zone.x1 && x < zone.x2 && y >= zone.y1 && y < zone.y2) {
          zoneStats[zoneId].population++;
          zoneStats[zoneId].totalFitness += citizen.fitness;
        }
      }
    }
    
    // Find dominant zone
    let dominantZone = 'none';
    let maxPop = 0;
    for (const [zoneId, stats] of Object.entries(zoneStats)) {
      if (stats.population > maxPop) {
        maxPop = stats.population;
        dominantZone = zoneId;
      }
    }
    
    const population = this.citizens.size;
    
    return {
      generation: this.generation,
      population,
      zones: zoneStats,
      dominantZone,
      averageFitness: population > 0 ? totalFitness / population : 0,
      extinct: population === 0,
      births,
      deaths,
      density: population / (this.width * this.height)
    };
  }

  /**
   * Place a bet
   */
  placeBet(bet) {
    const validTypes = [
      'colony_survival',    // Will there be survivors at generation X?
      'population_at_gen',  // Population count at generation X
      'dominant_zone',      // Which zone will dominate at generation X
      'extinction_gen',     // When will extinction happen?
      'pattern_emerges'     // Will a specific pattern emerge?
    ];
    
    if (!validTypes.includes(bet.type)) {
      throw new Error(`Invalid bet type. Valid: ${validTypes.join(', ')}`);
    }
    
    this.bets.push({
      id: Math.random().toString(36).substring(7),
      ...bet,
      placed: this.generation,
      status: 'pending'
    });
    
    return this.bets[this.bets.length - 1];
  }

  /**
   * Check and resolve bets
   */
  checkBets(stats) {
    for (const bet of this.bets) {
      if (bet.status !== 'pending') continue;
      
      switch (bet.type) {
        case 'colony_survival':
          if (this.generation >= bet.targetGen) {
            bet.status = stats.extinct ? 'lost' : 'won';
            bet.result = { survived: !stats.extinct, population: stats.population };
          }
          break;
          
        case 'population_at_gen':
          if (this.generation === bet.targetGen) {
            const diff = Math.abs(stats.population - bet.prediction);
            const tolerance = bet.tolerance || 5;
            bet.status = diff <= tolerance ? 'won' : 'lost';
            bet.result = { actual: stats.population, predicted: bet.prediction, diff };
          }
          break;
          
        case 'dominant_zone':
          if (this.generation === bet.targetGen) {
            bet.status = stats.dominantZone === bet.prediction ? 'won' : 'lost';
            bet.result = { actual: stats.dominantZone, predicted: bet.prediction };
          }
          break;
          
        case 'extinction_gen':
          if (stats.extinct) {
            const diff = Math.abs(this.generation - bet.prediction);
            const tolerance = bet.tolerance || 10;
            bet.status = diff <= tolerance ? 'won' : 'lost';
            bet.result = { actual: this.generation, predicted: bet.prediction, diff };
          }
          break;
      }
    }
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
      
      if (stats.extinct) break;
    }
    
    return results;
  }

  /**
   * Export for frontend visualization
   */
  toJSON() {
    const citizenData = [];
    
    for (const [key, citizen] of this.citizens) {
      const [x, y] = key.split(',').map(Number);
      citizenData.push({
        x, y,
        id: citizen.id,
        fitness: citizen.fitness,
        traits: citizen.getTraits(),
        age: citizen.age
      });
    }
    
    return {
      width: this.width,
      height: this.height,
      generation: this.generation,
      citizens: citizenData,
      stats: this.getStats(),
      bets: this.bets
    };
  }

  /**
   * Render ASCII for debugging
   */
  render() {
    let output = `Generation ${this.generation} (${this.citizens.size} citizens):\n`;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const key = `${x},${y}`;
        if (this.citizens.has(key)) {
          const citizen = this.citizens.get(key);
          // Show fitness level as character
          if (citizen.fitness > 0.7) output += '█';
          else if (citizen.fitness > 0.4) output += '▓';
          else output += '░';
        } else if (this.maze && this.maze[y][x] === 'WALL') {
          output += '▪';
        } else {
          output += '·';
        }
      }
      output += '\n';
    }
    
    return output;
  }
}

// CLI
if (require.main === module) {
  const fs = require('fs');
  const args = process.argv.slice(2);
  const params = {
    size: 20,
    density: 0.25,
    generations: 100,
    worldPath: null,
    visual: false
  };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '').replace(/-/g, '');
    let value = args[i + 1];
    if (!isNaN(value)) value = Number(value);
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    
    const keyMap = { 'worldpath': 'worldPath' };
    params[keyMap[key] || key] = value;
  }
  
  console.log('🏙️ Citizen World Simulation\n');
  
  let world;
  
  if (params.worldPath) {
    console.log(`Loading world from: ${params.worldPath}`);
    const worldData = JSON.parse(fs.readFileSync(params.worldPath, 'utf8'));
    world = new CitizenWorld();
    world.loadWorld(worldData);
  } else {
    console.log(`Creating ${params.size}x${params.size} world`);
    world = new CitizenWorld({ width: params.size, height: params.size });
  }
  
  world.seed(params.density);
  
  // Place some test bets
  world.placeBet({
    type: 'colony_survival',
    targetGen: params.generations,
    bettor: 'test_user'
  });
  
  world.placeBet({
    type: 'dominant_zone',
    targetGen: Math.floor(params.generations / 2),
    prediction: 'nw',
    bettor: 'test_user'
  });
  
  console.log(`Initial population: ${world.citizens.size}`);
  console.log(`Running ${params.generations} generations...\n`);
  
  if (params.visual) console.log(world.render());
  
  const results = world.run(params.generations, (stats) => {
    if (stats.generation % 20 === 0) {
      console.log(`Gen ${stats.generation}: Pop=${stats.population}, Dominant=${stats.dominantZone}, AvgFit=${stats.averageFitness.toFixed(3)}`);
      if (params.visual) console.log(world.render());
    }
  });
  
  const final = results[results.length - 1];
  
  console.log('\n📊 FINAL RESULTS:');
  console.log(JSON.stringify(final, null, 2));
  
  console.log('\n🎰 BET RESULTS:');
  for (const bet of world.bets) {
    console.log(`  ${bet.type}: ${bet.status.toUpperCase()}`);
    if (bet.result) console.log(`    ${JSON.stringify(bet.result)}`);
  }
  
  if (final.extinct) {
    console.log(`\n💀 EXTINCTION at generation ${final.generation}`);
  } else {
    console.log(`\n🏙️ Survived with ${final.population} citizens!`);
  }
}

module.exports = { CitizenWorld };
