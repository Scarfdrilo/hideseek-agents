/**
 * Maze Generator for HideSeek Agents
 * 
 * Generates playable mazes with hiding spots using Wave Function Collapse.
 */

const WaveFunctionCollapse = require('./wfc');

// Tile types for maze generation
const TILE_TYPES = {
  FLOOR: {
    char: '.',
    rules: {
      up: ['FLOOR', 'WALL', 'CORNER', 'HIDING_SPOT'],
      down: ['FLOOR', 'WALL', 'CORNER', 'HIDING_SPOT'],
      left: ['FLOOR', 'WALL', 'CORNER', 'HIDING_SPOT'],
      right: ['FLOOR', 'WALL', 'CORNER', 'HIDING_SPOT']
    }
  },
  WALL: {
    char: '#',
    rules: {
      up: ['WALL', 'CORNER', 'FLOOR'],
      down: ['WALL', 'CORNER', 'FLOOR'],
      left: ['WALL', 'CORNER', 'FLOOR'],
      right: ['WALL', 'CORNER', 'FLOOR']
    }
  },
  CORNER: {
    char: '+',
    rules: {
      up: ['WALL', 'CORNER'],
      down: ['WALL', 'CORNER'],
      left: ['WALL', 'CORNER'],
      right: ['WALL', 'CORNER']
    }
  },
  HIDING_SPOT: {
    char: 'H',
    rules: {
      up: ['FLOOR', 'WALL'],
      down: ['FLOOR', 'WALL'],
      left: ['FLOOR', 'WALL'],
      right: ['FLOOR', 'WALL']
    }
  },
  START: {
    char: 'S',
    rules: {
      up: ['FLOOR'],
      down: ['FLOOR'],
      left: ['FLOOR'],
      right: ['FLOOR']
    }
  }
};

class MazeGenerator {
  constructor(width = 20, height = 20, difficulty = 'medium') {
    this.width = width;
    this.height = height;
    this.difficulty = difficulty;
    this.maze = null;
    this.hidingSpots = [];
  }

  /**
   * Generate a maze with specified parameters
   */
  generate(seed = Date.now()) {
    const wfc = new WaveFunctionCollapse(this.width, this.height, TILE_TYPES);
    this.maze = wfc.generate(seed);
    
    // Post-process: ensure connectivity, add hiding spots
    this.ensureConnectivity();
    this.addHidingSpots();
    this.addStartPosition();
    
    return this.maze;
  }

  /**
   * Ensure maze is fully connected (all floors reachable)
   */
  ensureConnectivity() {
    // Simple flood-fill to check connectivity
    const visited = new Set();
    const start = this.findFirstFloor();
    if (!start) return;
    
    const queue = [start];
    visited.add(`${start.x},${start.y}`);
    
    while (queue.length > 0) {
      const { x, y } = queue.shift();
      
      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      ];
      
      for (const n of neighbors) {
        if (n.x < 0 || n.x >= this.width || n.y < 0 || n.y >= this.height) continue;
        
        const key = `${n.x},${n.y}`;
        if (visited.has(key)) continue;
        
        if (this.maze[n.y][n.x] === 'FLOOR' || this.maze[n.y][n.x] === 'HIDING_SPOT') {
          visited.add(key);
          queue.push(n);
        }
      }
    }
    
    // Any floor not visited = disconnected, convert to wall
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const key = `${x},${y}`;
        if (!visited.has(key) && this.maze[y][x] === 'FLOOR') {
          this.maze[y][x] = 'WALL';
        }
      }
    }
  }

  /**
   * Find first floor tile (for connectivity check)
   */
  findFirstFloor() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.maze[y][x] === 'FLOOR') {
          return { x, y };
        }
      }
    }
    return null;
  }

  /**
   * Add hiding spots based on difficulty
   */
  addHidingSpots() {
    const numSpots = this.difficulty === 'easy' ? 3 : 
                     this.difficulty === 'medium' ? 5 : 8;
    
    let attempts = 0;
    const maxAttempts = 100;
    
    while (this.hidingSpots.length < numSpots && attempts < maxAttempts) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      
      if (this.maze[y][x] === 'FLOOR' && this.isGoodHidingSpot(x, y)) {
        this.maze[y][x] = 'HIDING_SPOT';
        this.hidingSpots.push({ x, y, id: this.hidingSpots.length });
      }
      
      attempts++;
    }
  }

  /**
   * Check if location is a good hiding spot (corner, alcove, etc.)
   */
  isGoodHidingSpot(x, y) {
    let wallCount = 0;
    
    const neighbors = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 }
    ];
    
    for (const n of neighbors) {
      if (n.x < 0 || n.x >= this.width || n.y < 0 || n.y >= this.height) {
        wallCount++;
        continue;
      }
      
      if (this.maze[n.y][n.x] === 'WALL') {
        wallCount++;
      }
    }
    
    // Good hiding spot = 2-3 walls nearby (corner or alcove)
    return wallCount >= 2 && wallCount <= 3;
  }

  /**
   * Add start position for seekers
   */
  addStartPosition() {
    // Place start at center or random open spot
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    
    if (this.maze[centerY][centerX] === 'FLOOR') {
      this.maze[centerY][centerX] = 'START';
    } else {
      // Find nearest floor
      for (let r = 1; r < Math.max(this.width, this.height); r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            const x = centerX + dx;
            const y = centerY + dy;
            
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
              if (this.maze[y][x] === 'FLOOR') {
                this.maze[y][x] = 'START';
                return;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Render maze as ASCII
   */
  toASCII() {
    let output = '';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.maze[y][x];
        output += TILE_TYPES[tile]?.char || '?';
      }
      output += '\n';
    }
    return output;
  }

  /**
   * Export maze as JSON for frontend
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      difficulty: this.difficulty,
      maze: this.maze,
      hidingSpots: this.hidingSpots
    };
  }
}

module.exports = MazeGenerator;
