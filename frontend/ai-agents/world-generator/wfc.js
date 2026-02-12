/**
 * Wave Function Collapse - Simplified implementation for maze generation
 * 
 * Generates procedural 2D/3D mazes with hiding spots.
 * Based on: https://github.com/mxgmn/WaveFunctionCollapse
 */

class WaveFunctionCollapse {
  constructor(width, height, tileTypes) {
    this.width = width;
    this.height = height;
    this.tileTypes = tileTypes;
    this.grid = [];
    this.entropy = [];
    
    // Initialize grid with all possibilities
    for (let y = 0; y < height; y++) {
      this.grid[y] = [];
      this.entropy[y] = [];
      for (let x = 0; x < width; x++) {
        this.grid[y][x] = null; // Not yet collapsed
        this.entropy[y][x] = [...Object.keys(tileTypes)]; // All options available
      }
    }
  }

  /**
   * Run WFC algorithm until grid is fully collapsed
   */
  generate(seed = Date.now()) {
    this.rng = this.seededRandom(seed);
    
    while (!this.isFullyCollapsed()) {
      const cell = this.findLowestEntropyCell();
      if (!cell) break; // No more cells to collapse
      
      this.collapseCell(cell.x, cell.y);
      this.propagate(cell.x, cell.y);
    }
    
    return this.grid;
  }

  /**
   * Check if all cells have been collapsed
   */
  isFullyCollapsed() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === null) return false;
      }
    }
    return true;
  }

  /**
   * Find cell with lowest entropy (fewest possibilities)
   */
  findLowestEntropyCell() {
    let minEntropy = Infinity;
    let candidates = [];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] !== null) continue; // Already collapsed
        
        const entropy = this.entropy[y][x].length;
        if (entropy === 0) continue; // No valid options (contradiction)
        
        if (entropy < minEntropy) {
          minEntropy = entropy;
          candidates = [{ x, y }];
        } else if (entropy === minEntropy) {
          candidates.push({ x, y });
        }
      }
    }
    
    // Pick random cell from candidates with same entropy
    if (candidates.length === 0) return null;
    return candidates[Math.floor(this.rng() * candidates.length)];
  }

  /**
   * Collapse a cell to a specific tile type
   */
  collapseCell(x, y) {
    const options = this.entropy[y][x];
    if (options.length === 0) {
      console.warn(`Contradiction at (${x}, ${y})`);
      return;
    }
    
    // Pick random option weighted by tile probability
    const choice = options[Math.floor(this.rng() * options.length)];
    this.grid[y][x] = choice;
    this.entropy[y][x] = [choice];
  }

  /**
   * Propagate constraints to neighbors
   */
  propagate(x, y) {
    const queue = [{ x, y }];
    const visited = new Set();
    
    while (queue.length > 0) {
      const cell = queue.shift();
      const key = `${cell.x},${cell.y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      
      const tile = this.grid[cell.y][cell.x];
      if (tile === null) continue;
      
      // Update neighbors
      const neighbors = this.getNeighbors(cell.x, cell.y);
      for (const neighbor of neighbors) {
        if (this.grid[neighbor.y][neighbor.x] !== null) continue; // Already collapsed
        
        const validOptions = this.getValidNeighborTiles(tile, neighbor.direction);
        const oldEntropy = this.entropy[neighbor.y][neighbor.x].length;
        
        // Intersect with current entropy
        this.entropy[neighbor.y][neighbor.x] = this.entropy[neighbor.y][neighbor.x].filter(
          opt => validOptions.includes(opt)
        );
        
        // If entropy changed, add to queue
        if (this.entropy[neighbor.y][neighbor.x].length < oldEntropy) {
          queue.push({ x: neighbor.x, y: neighbor.y });
        }
      }
    }
  }

  /**
   * Get valid neighbor tiles based on current tile and direction
   */
  getValidNeighborTiles(tile, direction) {
    const rules = this.tileTypes[tile].rules || {};
    return rules[direction] || Object.keys(this.tileTypes);
  }

  /**
   * Get neighboring cells
   */
  getNeighbors(x, y) {
    const neighbors = [];
    
    if (x > 0) neighbors.push({ x: x - 1, y, direction: 'left' });
    if (x < this.width - 1) neighbors.push({ x: x + 1, y, direction: 'right' });
    if (y > 0) neighbors.push({ x, y: y - 1, direction: 'up' });
    if (y < this.height - 1) neighbors.push({ x, y: y + 1, direction: 'down' });
    
    return neighbors;
  }

  /**
   * Seeded random number generator
   */
  seededRandom(seed) {
    let state = seed;
    return function() {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }

  /**
   * Export grid as JSON
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      grid: this.grid,
      seed: this.seed
    };
  }
}

module.exports = WaveFunctionCollapse;
