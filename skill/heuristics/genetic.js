#!/usr/bin/env node
/**
 * Genetic Algorithm for Citizen Evolution
 * 
 * Inspired by natural selection:
 * - Population of "citizens" with traits (genes)
 * - Fitness function determines survival
 * - Selection, crossover, mutation create new generations
 * 
 * Usage:
 *   node genetic.js --population 50 --generations 100
 */

class Citizen {
  constructor(genes = null, geneLength = 10) {
    this.geneLength = geneLength;
    this.genes = genes || this.randomGenes();
    this.fitness = 0;
    this.age = 0;
    this.id = Math.random().toString(36).substring(7);
  }

  randomGenes() {
    const genes = [];
    for (let i = 0; i < this.geneLength; i++) {
      genes.push(Math.random());
    }
    return genes;
  }

  /**
   * Calculate fitness based on genes
   * Override this for custom fitness functions
   */
  calculateFitness(environment = {}) {
    // Default: maximize gene values (can be overridden)
    let fitness = 0;
    
    // Gene meanings (example):
    // 0: speed (higher = faster)
    // 1: strength (higher = stronger)
    // 2: intelligence (higher = smarter)
    // 3: stealth (higher = harder to find)
    // 4: endurance (higher = survives longer)
    // 5-9: specialized traits
    
    const speed = this.genes[0] || 0;
    const strength = this.genes[1] || 0;
    const intelligence = this.genes[2] || 0;
    const stealth = this.genes[3] || 0;
    const endurance = this.genes[4] || 0;
    
    // Environment affects which traits are valuable
    const { predatorDensity = 0.5, resourceScarcity = 0.5, mazeComplexity = 0.5 } = environment;
    
    // High predator density → stealth & speed valuable
    fitness += (stealth * 0.4 + speed * 0.3) * predatorDensity;
    
    // Resource scarcity → strength & intelligence valuable
    fitness += (strength * 0.3 + intelligence * 0.4) * resourceScarcity;
    
    // Complex maze → intelligence & endurance valuable
    fitness += (intelligence * 0.3 + endurance * 0.4) * mazeComplexity;
    
    // Base fitness from endurance
    fitness += endurance * 0.2;
    
    this.fitness = fitness;
    return fitness;
  }

  /**
   * Crossover with another citizen
   */
  crossover(partner) {
    const childGenes = [];
    const crossoverPoint = Math.floor(Math.random() * this.geneLength);
    
    for (let i = 0; i < this.geneLength; i++) {
      // Single-point crossover
      childGenes.push(i < crossoverPoint ? this.genes[i] : partner.genes[i]);
    }
    
    return new Citizen(childGenes, this.geneLength);
  }

  /**
   * Uniform crossover (each gene has 50% chance from either parent)
   */
  uniformCrossover(partner) {
    const childGenes = [];
    
    for (let i = 0; i < this.geneLength; i++) {
      childGenes.push(Math.random() < 0.5 ? this.genes[i] : partner.genes[i]);
    }
    
    return new Citizen(childGenes, this.geneLength);
  }

  /**
   * Mutate genes
   */
  mutate(rate = 0.01, amount = 0.1) {
    for (let i = 0; i < this.geneLength; i++) {
      if (Math.random() < rate) {
        // Add small random change
        this.genes[i] += (Math.random() - 0.5) * amount * 2;
        // Clamp to [0, 1]
        this.genes[i] = Math.max(0, Math.min(1, this.genes[i]));
      }
    }
  }

  /**
   * Clone this citizen
   */
  clone() {
    const clone = new Citizen([...this.genes], this.geneLength);
    clone.fitness = this.fitness;
    return clone;
  }

  /**
   * Get trait summary
   */
  getTraits() {
    return {
      speed: this.genes[0]?.toFixed(2) || 0,
      strength: this.genes[1]?.toFixed(2) || 0,
      intelligence: this.genes[2]?.toFixed(2) || 0,
      stealth: this.genes[3]?.toFixed(2) || 0,
      endurance: this.genes[4]?.toFixed(2) || 0
    };
  }
}

class GeneticAlgorithm {
  constructor(options = {}) {
    this.populationSize = options.populationSize || 50;
    this.geneLength = options.geneLength || 10;
    this.mutationRate = options.mutationRate || 0.01;
    this.mutationAmount = options.mutationAmount || 0.1;
    this.eliteCount = options.eliteCount || 2;
    this.crossoverMethod = options.crossoverMethod || 'uniform';
    
    this.population = [];
    this.generation = 0;
    this.bestEver = null;
    this.history = [];
    this.environment = options.environment || {};
  }

  /**
   * Initialize random population
   */
  initialize() {
    this.population = [];
    for (let i = 0; i < this.populationSize; i++) {
      this.population.push(new Citizen(null, this.geneLength));
    }
  }

  /**
   * Evaluate fitness of all citizens
   */
  evaluate() {
    for (const citizen of this.population) {
      citizen.calculateFitness(this.environment);
    }
    
    // Sort by fitness (descending)
    this.population.sort((a, b) => b.fitness - a.fitness);
    
    // Track best ever
    if (!this.bestEver || this.population[0].fitness > this.bestEver.fitness) {
      this.bestEver = this.population[0].clone();
    }
  }

  /**
   * Tournament selection
   */
  tournamentSelect(tournamentSize = 3) {
    const tournament = [];
    for (let i = 0; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * this.population.length);
      tournament.push(this.population[idx]);
    }
    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  }

  /**
   * Roulette wheel selection (fitness proportionate)
   */
  rouletteSelect() {
    const totalFitness = this.population.reduce((sum, c) => sum + c.fitness, 0);
    let random = Math.random() * totalFitness;
    
    for (const citizen of this.population) {
      random -= citizen.fitness;
      if (random <= 0) return citizen;
    }
    
    return this.population[this.population.length - 1];
  }

  /**
   * Create next generation
   */
  evolve() {
    this.evaluate();
    
    const newPopulation = [];
    
    // Elitism: keep best citizens
    for (let i = 0; i < this.eliteCount; i++) {
      newPopulation.push(this.population[i].clone());
    }
    
    // Fill rest with children
    while (newPopulation.length < this.populationSize) {
      // Select parents
      const parent1 = this.tournamentSelect();
      const parent2 = this.tournamentSelect();
      
      // Crossover
      let child;
      if (this.crossoverMethod === 'uniform') {
        child = parent1.uniformCrossover(parent2);
      } else {
        child = parent1.crossover(parent2);
      }
      
      // Mutate
      child.mutate(this.mutationRate, this.mutationAmount);
      
      newPopulation.push(child);
    }
    
    // Age existing citizens
    for (const citizen of this.population) {
      citizen.age++;
    }
    
    this.population = newPopulation;
    this.generation++;
    
    // Record history
    const stats = this.getStats();
    this.history.push(stats);
    
    return stats;
  }

  /**
   * Get current generation statistics
   */
  getStats() {
    const fitnesses = this.population.map(c => c.fitness);
    const best = this.population[0];
    
    return {
      generation: this.generation,
      best: {
        fitness: best.fitness,
        traits: best.getTraits(),
        id: best.id
      },
      bestEver: this.bestEver ? {
        fitness: this.bestEver.fitness,
        traits: this.bestEver.getTraits()
      } : null,
      average: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      worst: fitnesses[fitnesses.length - 1],
      diversity: this.calculateDiversity()
    };
  }

  /**
   * Calculate genetic diversity (how different citizens are)
   */
  calculateDiversity() {
    if (this.population.length < 2) return 0;
    
    let totalDiff = 0;
    let comparisons = 0;
    
    for (let i = 0; i < Math.min(10, this.population.length); i++) {
      for (let j = i + 1; j < Math.min(10, this.population.length); j++) {
        const citizen1 = this.population[i];
        const citizen2 = this.population[j];
        
        let diff = 0;
        for (let g = 0; g < this.geneLength; g++) {
          diff += Math.abs(citizen1.genes[g] - citizen2.genes[g]);
        }
        totalDiff += diff / this.geneLength;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalDiff / comparisons : 0;
  }

  /**
   * Run for N generations
   */
  run(generations, callback) {
    const results = [];
    
    for (let i = 0; i < generations; i++) {
      const stats = this.evolve();
      results.push(stats);
      
      if (callback) callback(stats);
    }
    
    return results;
  }

  /**
   * Get survivors (top N citizens)
   */
  getTopCitizens(n = 5) {
    return this.population.slice(0, n).map(c => ({
      id: c.id,
      fitness: c.fitness,
      traits: c.getTraits(),
      genes: c.genes
    }));
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const params = {
    population: 50,
    generations: 100,
    mutationRate: 0.05,
    genes: 10
  };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    let value = args[i + 1];
    if (!isNaN(value)) value = Number(value);
    params[key] = value;
  }
  
  console.log('🧬 Genetic Algorithm - Citizen Evolution\n');
  console.log(`Population: ${params.population}`);
  console.log(`Generations: ${params.generations}`);
  console.log(`Mutation Rate: ${params.mutationRate}\n`);
  
  const ga = new GeneticAlgorithm({
    populationSize: params.population,
    geneLength: params.genes,
    mutationRate: params.mutationRate,
    environment: {
      predatorDensity: 0.6,
      resourceScarcity: 0.4,
      mazeComplexity: 0.7
    }
  });
  
  ga.initialize();
  
  const results = ga.run(params.generations, (stats) => {
    if (stats.generation % 10 === 0 || stats.generation === 1) {
      console.log(`Gen ${stats.generation}: Best=${stats.best.fitness.toFixed(3)}, Avg=${stats.average.toFixed(3)}, Diversity=${stats.diversity.toFixed(3)}`);
    }
  });
  
  const final = results[results.length - 1];
  console.log('\n🏆 FINAL RESULTS:');
  console.log(JSON.stringify(final, null, 2));
  
  console.log('\n👑 Top 3 Citizens:');
  const top = ga.getTopCitizens(3);
  top.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.id}: Fitness ${c.fitness.toFixed(3)}`);
    console.log(`     Traits: ${JSON.stringify(c.traits)}`);
  });
}

module.exports = { GeneticAlgorithm, Citizen };
