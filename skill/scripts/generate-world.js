#!/usr/bin/env node
/**
 * HideSeek World Generator
 * 
 * Generates unique 2D isometric maze worlds based on agent personality AND MEMORY.
 * 
 * Usage:
 *   node generate-world.js --name "AgentName" --theme neon --size 15
 *   
 * With personality JSON:
 *   node generate-world.js --personality '{"traits":["cyberpunk","tech"]}'
 *
 * With memory directory (reads MEMORY.md + memory/*.md):
 *   node generate-world.js --memory-path ~/.openclaw/workspace --name "Scarfdrilo"
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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
  },
  swamp: {
    wall: '#1a3d2e',
    wallTop: '#2a5d3e',
    wallSide: '#0a2d1e',
    floor: '#0d1f15',
    floorAlt: '#0f2518',
    start: '#00ff66',
    exit: '#ff4400',
    hiding: '#00aacc',
    glow: '#33ff99',
    bg: '#050a08'
  }
};

// Special element types that can be generated from memory
const MEMORY_ELEMENT_TYPES = {
  hobby: { tile: 'HOBBY_ZONE', color: '#ffaa00' },
  person: { tile: 'MEMORIAL', color: '#ff88cc' },
  place: { tile: 'PORTAL', color: '#00ccff' },
  interest: { tile: 'SHRINE', color: '#aa00ff' },
  achievement: { tile: 'TROPHY', color: '#ffcc00' },
  pet: { tile: 'PET_AREA', color: '#88ff88' }
};

// Seeded random for reproducibility
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Read agent memory files and extract meaningful content
 */
function readAgentMemory(memoryPath) {
  const memory = {
    raw: '',
    facts: [],
    people: [],
    interests: [],
    achievements: [],
    keywords: []
  };

  try {
    // Read MEMORY.md
    const memoryMdPath = path.join(memoryPath, 'MEMORY.md');
    if (fs.existsSync(memoryMdPath)) {
      memory.raw += fs.readFileSync(memoryMdPath, 'utf8') + '\n';
    }

    // Read IDENTITY.md
    const identityPath = path.join(memoryPath, 'IDENTITY.md');
    if (fs.existsSync(identityPath)) {
      memory.raw += fs.readFileSync(identityPath, 'utf8') + '\n';
    }

    // Read TOOLS.md for personal context
    const toolsPath = path.join(memoryPath, 'TOOLS.md');
    if (fs.existsSync(toolsPath)) {
      memory.raw += fs.readFileSync(toolsPath, 'utf8') + '\n';
    }

    // Read memory/*.md files (recent daily notes)
    const memoryDir = path.join(memoryPath, 'memory');
    if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir)
        .filter(f => f.endsWith('.md'))
        .sort()
        .slice(-7); // Last 7 days
      
      for (const file of files) {
        memory.raw += fs.readFileSync(path.join(memoryDir, file), 'utf8') + '\n';
      }
    }
  } catch (err) {
    console.error('Error reading memory:', err.message);
  }

  // Extract meaningful data from raw memory
  if (memory.raw) {
    memory.facts = extractFacts(memory.raw);
    memory.people = extractPeople(memory.raw);
    memory.interests = extractInterests(memory.raw);
    memory.keywords = extractKeywords(memory.raw);
  }

  return memory;
}

/**
 * Extract facts from memory text
 */
function extractFacts(text) {
  const facts = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Look for lines with specific patterns
    if (line.includes(':') && !line.startsWith('#')) {
      const match = line.match(/[-*]\s*\*\*([^*]+)\*\*[:\s]+(.+)/);
      if (match) {
        facts.push({ key: match[1].trim(), value: match[2].trim() });
      }
    }
  }
  
  return facts;
}

/**
 * Extract people/contacts from memory
 */
function extractPeople(text) {
  const people = [];
  
  // Match patterns like "Name - description" or "Name: description"
  const patterns = [
    /[-*]\s*([A-Z][a-záéíóúñ]+(?:\s+[A-Z]?[a-záéíóúñ]+)?)\s*[-:]\s*([^,\n]+)/gi,
    /\*\*([A-Z][a-záéíóúñ]+)\*\*\s*[-=:]\s*([^\n]+)/gi
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      // Filter out common non-name words
      if (!['Status', 'Balance', 'Contract', 'GitHub', 'Name', 'Track', 'API'].includes(name)) {
        people.push({
          name,
          description: match[2].trim().substring(0, 100)
        });
      }
    }
  }
  
  return people.slice(0, 5); // Max 5 people
}

/**
 * Extract interests/hobbies from memory
 */
function extractInterests(text) {
  const interests = [];
  const interestKeywords = [
    'teje', 'knit', 'crochet', 'tejer',
    'series', 'movies', 'películas',
    'code', 'coding', 'programación', 'código',
    'games', 'gaming', 'juegos',
    'music', 'música',
    'art', 'arte', 'dibujo',
    'sports', 'deportes',
    'crypto', 'blockchain', 'web3',
    'ai', 'artificial intelligence',
    'cooking', 'cocina',
    'reading', 'lectura', 'libros',
    'travel', 'viaje',
    'photography', 'fotografía',
    'temu', 'shopping', 'compras'
  ];
  
  const lowerText = text.toLowerCase();
  
  for (const keyword of interestKeywords) {
    if (lowerText.includes(keyword)) {
      interests.push(keyword);
    }
  }
  
  return [...new Set(interests)]; // Unique
}

/**
 * Extract significant keywords from memory
 */
function extractKeywords(text) {
  const words = text.toLowerCase()
    .replace(/[#*\[\](){}]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);
  
  const counts = {};
  for (const word of words) {
    if (!/^[0-9x]+$/.test(word) && !/^https?/.test(word)) {
      counts[word] = (counts[word] || 0) + 1;
    }
  }
  
  return Object.entries(counts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * Generate special elements from memory
 */
function generateMemoryElements(memory, seed) {
  const elements = [];
  const random = seededRandom(seed + 2000);
  
  // Add elements for people in memory
  for (const person of memory.people.slice(0, 3)) {
    elements.push({
      type: 'person',
      tile: 'MEMORIAL',
      name: person.name,
      description: person.description,
      reason: `Memory of ${person.name}`,
      color: '#ff88cc'
    });
  }
  
  // Add elements for interests
  for (const interest of memory.interests.slice(0, 3)) {
    const elementType = interest.includes('teje') || interest.includes('knit') 
      ? 'hobby' 
      : interest.includes('game') || interest.includes('juego')
      ? 'achievement'
      : 'interest';
    
    elements.push({
      type: elementType,
      tile: MEMORY_ELEMENT_TYPES[elementType].tile,
      name: interest,
      description: `Zone inspired by: ${interest}`,
      reason: `Agent memory contains interest in "${interest}"`,
      color: MEMORY_ELEMENT_TYPES[elementType].color
    });
  }
  
  return elements;
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
function placeSpecialTiles(maze, seed, hidingSpotCount = 3, memoryElements = []) {
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
  let availableFloors = floors.filter(
    f => maze[f.y][f.x] === 'FLOOR'
  );
  
  for (let i = 0; i < hidingSpotCount && availableFloors.length > 0; i++) {
    const idx = Math.floor(random() * availableFloors.length);
    const spot = availableFloors.splice(idx, 1)[0];
    maze[spot.y][spot.x] = 'HIDING';
    hidingSpots.push(spot);
  }
  
  // Place memory-based elements
  const placedElements = [];
  availableFloors = floors.filter(f => maze[f.y][f.x] === 'FLOOR');
  
  for (const element of memoryElements) {
    if (availableFloors.length === 0) break;
    
    const idx = Math.floor(random() * availableFloors.length);
    const spot = availableFloors.splice(idx, 1)[0];
    maze[spot.y][spot.x] = element.tile;
    placedElements.push({
      ...element,
      position: { x: spot.x, y: spot.y }
    });
  }
  
  return {
    start: startPos,
    exit: exitPos,
    hidingSpots,
    memoryElements: placedElements
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
    lore = '',
    memoryPath = null
  } = params;
  
  // Clamp values to constraints
  const clampedSize = Math.min(25, Math.max(10, size));
  const clampedComplexity = Math.min(0.9, Math.max(0.3, complexity));
  const clampedHidingSpots = Math.min(5, Math.max(1, hidingSpots));
  
  // Read agent memory if path provided
  let memory = { raw: '', facts: [], people: [], interests: [], keywords: [] };
  let memoryElements = [];
  
  if (memoryPath) {
    memory = readAgentMemory(memoryPath);
    memoryElements = generateMemoryElements(memory, seed);
    console.error(`[Memory] Found ${memory.people.length} people, ${memory.interests.length} interests`);
    console.error(`[Memory] Generated ${memoryElements.length} special elements`);
  }
  
  // Generate maze
  const maze = generateMaze(clampedSize, seed, clampedComplexity);
  const specialTiles = placeSpecialTiles(maze, seed, clampedHidingSpots, memoryElements);
  
  // Get colors
  const themeColors = colors || THEMES[theme] || THEMES.neon;
  
  // Generate lore from memory if not provided
  let finalLore = lore;
  if (!lore && memory.raw) {
    const interests = memory.interests.slice(0, 3).join(', ');
    const people = memory.people.slice(0, 2).map(p => p.name).join(' & ');
    finalLore = `A world shaped by memories${interests ? ` of ${interests}` : ''}${people ? `, with echoes of ${people}` : ''}...`;
  }
  
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
    memoryElements: specialTiles.memoryElements,
    colors: themeColors,
    lore: finalLore,
    memoryStats: {
      peopleCount: memory.people.length,
      interestsCount: memory.interests.length,
      keywordsFound: memory.keywords.slice(0, 10)
    },
    generatedAt: new Date().toISOString()
  };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '').replace(/-/g, '');
    let value = args[i + 1];
    
    // Handle memorypath -> memoryPath
    const keyMap = {
      'memorypath': 'memoryPath'
    };
    const normalizedKey = keyMap[key.toLowerCase()] || key;
    
    // Parse JSON values
    if (value?.startsWith('{') || value?.startsWith('[')) {
      try {
        value = JSON.parse(value);
      } catch (e) {}
    }
    
    // Parse numbers
    if (!isNaN(value) && value !== '' && normalizedKey !== 'memoryPath') {
      value = Number(value);
    }
    
    params[normalizedKey] = value;
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
    } else if (p.traits?.includes('swamp') || p.traits?.includes('crocodile')) {
      params.theme = params.theme || 'swamp';
    }
  }
  
  const world = generateWorld(params);
  console.log(JSON.stringify(world, null, 2));
}

module.exports = { generateWorld, generateMaze, readAgentMemory, THEMES, MEMORY_ELEMENT_TYPES };
