/**
 * Simplified Maze Generator using Recursive Backtracking
 * More reliable than WFC for generating playable mazes
 */

class SimpleMazeGenerator {
  constructor(width = 20, height = 20, difficulty = 'medium') {
    this.width = width;
    this.height = height;
    this.difficulty = difficulty;
    this.maze = [];
    this.hidingSpots = [];
    
    // Initialize maze with walls
    for (let y = 0; y < height; y++) {
      this.maze[y] = [];
      for (let x = 0; x < width; x++) {
        this.maze[y][x] = 'WALL';
      }
    }
  }

  /**
   * Generate maze using recursive backtracking
   */
  generate(seed = Date.now()) {
    this.rng = this.seededRandom(seed);
    
    // Start from center
    const startX = Math.floor(this.width / 2);
    const startY = Math.floor(this.height / 2);
    
    this.carvePassages(startX, startY);
    this.addHidingSpots();
    this.addStartPosition();
    
    return this.maze;
  }

  /**
   * Recursive backtracking to carve passages
   */
  carvePassages(x, y) {
    this.maze[y][x] = 'FLOOR';
    
    // Random order of directions
    const directions = this.shuffleArray([
      { dx: 0, dy: -2 },  // Up
      { dx: 0, dy: 2 },   // Down
      { dx: -2, dy: 0 },  // Left
      { dx: 2, dy: 0 }    // Right
    ]);
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      if (this.isValid(nx, ny) && this.maze[ny][nx] === 'WALL') {
        // Carve passage between current and next cell
        this.maze[y + dir.dy / 2][x + dir.dx / 2] = 'FLOOR';
        this.carvePassages(nx, ny);
      }
    }
  }

  /**
   * Check if coordinates are valid
   */
  isValid(x, y) {
    return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1;
  }

  /**
   * Add hiding spots in strategic locations
   */
  addHidingSpots() {
    const numSpots = this.difficulty === 'easy' ? 3 :
                     this.difficulty === 'medium' ? 5 : 8;
    
    const candidates = [];
    
    // Find all good hiding spots (dead ends, corners)
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.maze[y][x] === 'FLOOR' && this.isGoodHidingSpot(x, y)) {
          candidates.push({ x, y });
        }
      }
    }
    
    // Shuffle and pick top N
    this.shuffleArray(candidates);
    
    for (let i = 0; i < Math.min(numSpots, candidates.length); i++) {
      const spot = candidates[i];
      this.maze[spot.y][spot.x] = 'HIDING_SPOT';
      this.hidingSpots.push({ x: spot.x, y: spot.y, id: i });
    }
  }

  /**
   * Check if location is a good hiding spot
   */
  isGoodHidingSpot(x, y) {
    let wallCount = 0;
    let floorCount = 0;
    
    const neighbors = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 }
    ];
    
    for (const n of neighbors) {
      if (this.maze[n.y][n.x] === 'WALL') {
        wallCount++;
      } else if (this.maze[n.y][n.x] === 'FLOOR') {
        floorCount++;
      }
    }
    
    // Dead end (3 walls, 1 floor) or corner (2 walls, 2 floors)
    return (wallCount === 3 && floorCount === 1) || 
           (wallCount === 2 && floorCount === 2);
  }

  /**
   * Add start position
   */
  addStartPosition() {
    // Find first floor tile
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.maze[y][x] === 'FLOOR') {
          this.maze[y][x] = 'START';
          return;
        }
      }
    }
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Seeded random
   */
  seededRandom(seed) {
    let state = seed;
    return function() {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }

  /**
   * Render as ASCII
   */
  toASCII() {
    const chars = {
      'WALL': '#',
      'FLOOR': '.',
      'HIDING_SPOT': 'H',
      'START': 'S'
    };
    
    let output = '';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        output += chars[this.maze[y][x]] || '?';
      }
      output += '\n';
    }
    return output;
  }

  /**
   * Export as JSON
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

module.exports = SimpleMazeGenerator;
