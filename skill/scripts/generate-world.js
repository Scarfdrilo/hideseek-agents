#!/usr/bin/env node
/**
 * HideSeek World Generator
 * 
 * Generates unique 2D isometric maze worlds based on agent personality.
 * 
 * Usage:
 *   node generate-world.js --name "AgentName" --theme neon --size 15
 *   
 * Or with personality JSON:
 *   node generate-world.js --personality '{"traits":["cyberpunk","tech"]}'
 */

const crypto = require('crypto');

// Theme color palettes
const THEMES = {
  neon: {
    wall: '#1a1a2e',
    wallTop: '#16213e',
    wallSide: '#0f0f1a',
    floor: '#0a0a12',
    floorAlt: '#0d0d18',
    start: '#00ff88',
    exit: '#ff00aa',
    hiding: '#00aaff',
    glow: '#00ffcc',
    bg: '#050508'
  },
  forest: {
    wall: '#2d5a27',
    wallTop: '#3d7a37',
    wallSide: '#1d3a17',
    floor: '#1a3015',
    floorAlt: '#1f3818',
    start: '#88ff00',
    exit: '#ffaa00',
    hiding: '#00ccaa',
    glow: '#aaff00',
    bg: '#0a1008'
  },
  dungeon: {
    wall: '#3a3a4a',
    wallTop: '#4a4a5a',
    wallSide: '#2a2a3a',
    floor: '#1a1a22',
    floorAlt: '#1f1f28',
    start: '#ffcc00',
    exit: '#ff4444',
    hiding: '#8844ff',
    glow: '#ff8800',
    bg: '#08080a'
  },
  candy: {
    wall: '#ff88aa',
    wallTop: '#ffaacc',
    wallSide: '#cc6688',
    floor: '#442244',
    floorAlt: '#4a2a4a',
    start: '#88ffaa',
    exit: '#ffff44',
    hiding: '#44ffff',
    glow: '#ff88ff',
    bg: '#220022'
  }
};

// Seeded random for reproducibility
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Generate maze using DFS
function generateMaze(size, seed, complexity = 0.6) {
  const random = seededRandom(seed);
  const maze = [];
  
  // Initialize all walls
  for (let y = 0; y < size; y++) {
    maze[y] = [];
    for (let x = 0; x < size; x++) {
      maze[y][x] = 'WALL';
    }
  }
  
  // DFS carving
  const stack = [];
  const startX = 1;
  const startZ = 1;
  maze[startZ][startX] = 'FLOOR';
  stack.push([startX, startZ]);
  
  const directions = [[0, -2], [0, 2], [-2, 0], [2, 0]];
  
  const shuffle = (arr) => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  
  while (stack.length > 0) {
    const [cx, cz] = stack[stack.length - 1];
    const shuffledDirs = shuffle(directions);
    let carved = false;
    
    for (const [dx, dz] of shuffledDirs) {
      const nx = cx + dx;
      const nz = cz + dz;
      
      if (nx > 0 && nx < size - 1 && nz > 0 && nz < size - 1 && maze[nz][nx] === 'WALL') {
        maze[cz + dz / 2][cx + dx / 2] = 'FLOOR';
        maze[nz][nx] = 'FLOOR';
        stack.push([nx, nz]);
        carved = true;
        break;
      }
    }
    
    if (!carved) stack.pop();
  }
  
  // Add extra passages based on complexity
  const extraPassages = Math.floor(size * complexity);
  for (let i = 0; i < extraPassages; i++) {
    const x = Math.floor(random() * (size - 2)) + 1;
    const y = Math.floor(random() * (size - 2)) + 1;
    if (maze[y][x] === 'WALL') {
      // Check if making this a floor creates a valid passage
      let floorNeighbors = 0;
      if (maze[y-1]?.[x] === 'FLOOR') floorNeighbors++;
      if (maze[y+1]?.[x] === 'FLOOR') floorNeighbors++;
      if (maze[y]?.[x-1] === 'FLOOR') floorNeighbors++;
      if (maze[y]?.[x+1] === 'FLOOR') floorNeighbors++;
      if (floorNeighbors >= 2) {
        maze[y][x] = 'FLOOR';
      }
    }
  }
  
  return maze;
}

// Place special tiles
function placeSpecialTiles(maze, seed, hidingSpotCount = 3) {
  const random = seededRandom(seed + 1000);
  const size = maze.length;
  const floors = [];
  
  // Find all floor tiles
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (maze[y][x] === 'FLOOR') {
        floors.push({ x, y });
      }
    }
  }
  
  // Place start (near center)
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  let startPos = floors[0];
  let minDistToCenter = Infinity;
  
  for (const pos of floors) {
    const dist = Math.abs(pos.x - centerX) + Math.abs(pos.y - centerY);
    if (dist < minDistToCenter) {
      minDistToCenter = dist;
      startPos = pos;
    }
  }
  maze[startPos.y][startPos.x] = 'START';
  
  // Place exit (far from start)
  let exitPos = floors[floors.length - 1];
  let maxDistFromStart = 0;
  
  for (const pos of floors) {
    if (maze[pos.y][pos.x] !== 'START') {
      const dist = Math.abs(pos.x - startPos.x) + Math.abs(pos.y - startPos.y);
      if (dist > maxDistFromStart) {
        maxDistFromStart = dist;
        exitPos = pos;
      }
    }
  }
  maze[exitPos.y][exitPos.x] = 'EXIT';
  
  // Place hiding spots
  const hidingSpots = [];
  const availableFloors = floors.filter(
    f => maze[f.y][f.x] === 'FLOOR'
  );
  
  for (let i = 0; i < hidingSpotCount && availableFloors.length > 0; i++) {
    const idx = Math.floor(random() * availableFloors.length);
    const spot = availableFloors.splice(idx, 1)[0];
    maze[spot.y][spot.x] = 'HIDING';
    hidingSpots.push(spot);
  }
  
  return {
    start: startPos,
    exit: exitPos,
    hidingSpots
  };
}

// Generate world from parameters
function generateWorld(params) {
  const {
    name = 'Unknown Agent',
    theme = 'neon',
    size = 15,
    complexity = 0.6,
    hidingSpots = 3,
    seed = Date.now(),
    colors = null,
    lore = ''
  } = params;
  
  // Clamp values to constraints
  const clampedSize = Math.min(25, Math.max(10, size));
  const clampedComplexity = Math.min(0.9, Math.max(0.3, complexity));
  const clampedHidingSpots = Math.min(5, Math.max(1, hidingSpots));
  
  // Generate maze
  const maze = generateMaze(clampedSize, seed, clampedComplexity);
  const specialTiles = placeSpecialTiles(maze, seed, clampedHidingSpots);
  
  // Get colors
  const themeColors = colors || THEMES[theme] || THEMES.neon;
  
  return {
    name,
    theme,
    size: clampedSize,
    complexity: clampedComplexity,
    seed,
    maze,
    start: specialTiles.start,
    exit: specialTiles.exit,
    hidingSpots: specialTiles.hidingSpots,
    colors: themeColors,
    lore,
    generatedAt: new Date().toISOString()
  };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    let value = args[i + 1];
    
    // Parse JSON values
    if (value?.startsWith('{') || value?.startsWith('[')) {
      try {
        value = JSON.parse(value);
      } catch (e) {}
    }
    
    // Parse numbers
    if (!isNaN(value) && value !== '') {
      value = Number(value);
    }
    
    params[key] = value;
  }
  
  // If personality provided, derive theme from traits
  if (params.personality) {
    const p = typeof params.personality === 'string' 
      ? JSON.parse(params.personality) 
      : params.personality;
    
    if (p.traits?.includes('cyberpunk') || p.traits?.includes('tech')) {
      params.theme = params.theme || 'neon';
    } else if (p.traits?.includes('nature') || p.traits?.includes('organic')) {
      params.theme = params.theme || 'forest';
    } else if (p.traits?.includes('dark') || p.traits?.includes('mysterious')) {
      params.theme = params.theme || 'dungeon';
    } else if (p.traits?.includes('fun') || p.traits?.includes('playful')) {
      params.theme = params.theme || 'candy';
    }
  }
  
  const world = generateWorld(params);
  console.log(JSON.stringify(world, null, 2));
}

module.exports = { generateWorld, generateMaze, THEMES };
