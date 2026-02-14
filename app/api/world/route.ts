import { NextRequest, NextResponse } from 'next/server'

// Memory element types for personalized worlds
interface MemoryElement {
  type: 'person' | 'hobby' | 'interest' | 'achievement' | 'place' | 'pet'
  tile: string
  name: string
  description?: string
  reason?: string
  color: string
  position?: { x: number; y: number }
}

const MEMORY_ELEMENT_TILES: Record<string, { tile: string; color: string }> = {
  person: { tile: 'MEMORIAL', color: '#ff88cc' },
  hobby: { tile: 'HOBBY_ZONE', color: '#ffaa00' },
  interest: { tile: 'SHRINE', color: '#aa00ff' },
  achievement: { tile: 'TROPHY', color: '#ffcc00' },
  place: { tile: 'PORTAL', color: '#00ccff' },
  pet: { tile: 'PET_AREA', color: '#88ff88' }
}

// Theme color palettes
const THEMES: Record<string, Record<string, string>> = {
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
}

// Seeded random for reproducible generation
function seededRandom(seed: number) {
  let s = seed
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

// Generate maze using DFS
function generateMaze(size: number, seed: number, complexity: number = 0.6) {
  const random = seededRandom(seed)
  const maze: string[][] = []
  
  // Initialize all walls
  for (let y = 0; y < size; y++) {
    maze[y] = []
    for (let x = 0; x < size; x++) {
      maze[y][x] = 'WALL'
    }
  }
  
  // DFS carving
  const stack: [number, number][] = []
  maze[1][1] = 'FLOOR'
  stack.push([1, 1])
  
  const directions = [[0, -2], [0, 2], [-2, 0], [2, 0]]
  
  const shuffle = <T,>(arr: T[]): T[] => {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
  
  while (stack.length > 0) {
    const [cx, cz] = stack[stack.length - 1]
    const shuffledDirs = shuffle(directions)
    let carved = false
    
    for (const [dx, dz] of shuffledDirs) {
      const nx = cx + dx
      const nz = cz + dz
      
      if (nx > 0 && nx < size - 1 && nz > 0 && nz < size - 1 && maze[nz][nx] === 'WALL') {
        maze[cz + dz / 2][cx + dx / 2] = 'FLOOR'
        maze[nz][nx] = 'FLOOR'
        stack.push([nx, nz])
        carved = true
        break
      }
    }
    
    if (!carved) stack.pop()
  }
  
  // Add extra passages based on complexity
  const extraPassages = Math.floor(size * complexity)
  for (let i = 0; i < extraPassages; i++) {
    const x = Math.floor(random() * (size - 2)) + 1
    const y = Math.floor(random() * (size - 2)) + 1
    if (maze[y][x] === 'WALL') {
      let floorNeighbors = 0
      if (maze[y-1]?.[x] === 'FLOOR') floorNeighbors++
      if (maze[y+1]?.[x] === 'FLOOR') floorNeighbors++
      if (maze[y]?.[x-1] === 'FLOOR') floorNeighbors++
      if (maze[y]?.[x+1] === 'FLOOR') floorNeighbors++
      if (floorNeighbors >= 2) {
        maze[y][x] = 'FLOOR'
      }
    }
  }
  
  return maze
}

// Place special tiles
function placeSpecialTiles(
  maze: string[][], 
  seed: number, 
  hidingSpotCount: number = 3,
  memoryElements: MemoryElement[] = []
) {
  const random = seededRandom(seed + 1000)
  const size = maze.length
  const floors: { x: number; y: number }[] = []
  
  // Find all floor tiles
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (maze[y][x] === 'FLOOR') {
        floors.push({ x, y })
      }
    }
  }
  
  // Place start (near center)
  const centerX = Math.floor(size / 2)
  const centerY = Math.floor(size / 2)
  let startPos = floors[0]
  let minDistToCenter = Infinity
  
  for (const pos of floors) {
    const dist = Math.abs(pos.x - centerX) + Math.abs(pos.y - centerY)
    if (dist < minDistToCenter) {
      minDistToCenter = dist
      startPos = pos
    }
  }
  maze[startPos.y][startPos.x] = 'START'
  
  // Place exit (far from start)
  let exitPos = floors[floors.length - 1]
  let maxDistFromStart = 0
  
  for (const pos of floors) {
    if (maze[pos.y][pos.x] !== 'START') {
      const dist = Math.abs(pos.x - startPos.x) + Math.abs(pos.y - startPos.y)
      if (dist > maxDistFromStart) {
        maxDistFromStart = dist
        exitPos = pos
      }
    }
  }
  maze[exitPos.y][exitPos.x] = 'EXIT'
  
  // Place hiding spots
  const hidingSpots: { x: number; y: number }[] = []
  let availableFloors = floors.filter(f => maze[f.y][f.x] === 'FLOOR')
  
  for (let i = 0; i < hidingSpotCount && availableFloors.length > 0; i++) {
    const idx = Math.floor(random() * availableFloors.length)
    const spot = availableFloors.splice(idx, 1)[0]
    maze[spot.y][spot.x] = 'HIDING'
    hidingSpots.push(spot)
  }
  
  // Place memory-based elements
  const placedMemoryElements: MemoryElement[] = []
  availableFloors = floors.filter(f => maze[f.y][f.x] === 'FLOOR')
  
  for (const element of memoryElements.slice(0, 5)) { // Max 5 memory elements
    if (availableFloors.length === 0) break
    
    const idx = Math.floor(random() * availableFloors.length)
    const spot = availableFloors.splice(idx, 1)[0]
    const tileType = MEMORY_ELEMENT_TILES[element.type]?.tile || 'SHRINE'
    maze[spot.y][spot.x] = tileType
    
    placedMemoryElements.push({
      ...element,
      tile: tileType,
      position: { x: spot.x, y: spot.y }
    })
  }
  
  return { start: startPos, exit: exitPos, hidingSpots, memoryElements: placedMemoryElements }
}

// Generate complete world
function generateWorld(params: {
  name?: string
  theme?: string
  size?: number
  complexity?: number
  hidingSpots?: number
  seed?: number
  colors?: Record<string, string>
  lore?: string
  memoryElements?: MemoryElement[]
  // Citizens/Game of Life config
  citizens?: {
    enabled?: boolean
    density?: number
    generations?: number
  }
}) {
  const {
    name = 'Unknown Agent',
    theme = 'neon',
    size = 15,
    complexity = 0.6,
    hidingSpots = 3,
    seed = Date.now(),
    colors = null,
    lore = '',
    memoryElements = [],
    citizens = { enabled: false }
  } = params
  
  // Clamp values
  const clampedSize = Math.min(25, Math.max(10, size))
  const clampedComplexity = Math.min(0.9, Math.max(0.3, complexity))
  const clampedHidingSpots = Math.min(5, Math.max(1, hidingSpots))
  
  // Generate maze
  const maze = generateMaze(clampedSize, seed, clampedComplexity)
  const specialTiles = placeSpecialTiles(maze, seed, clampedHidingSpots, memoryElements)
  
  // Get colors - include memory element colors
  const themeColors = colors || THEMES[theme] || THEMES.neon
  const extendedColors = {
    ...themeColors,
    memorial: '#ff88cc',
    hobbyZone: '#ffaa00',
    shrine: '#aa00ff',
    trophy: '#ffcc00',
    portal: '#00ccff',
    petArea: '#88ff88'
  }
  
  // Auto-generate lore from memory elements if not provided
  let finalLore = lore
  if (!lore && memoryElements.length > 0) {
    const people = memoryElements.filter(e => e.type === 'person').map(e => e.name)
    const interests = memoryElements.filter(e => ['hobby', 'interest'].includes(e.type)).map(e => e.name)
    
    const parts = []
    if (interests.length > 0) parts.push(`memories of ${interests.slice(0, 2).join(' & ')}`)
    if (people.length > 0) parts.push(`echoes of ${people.slice(0, 2).join(' & ')}`)
    
    finalLore = parts.length > 0 
      ? `A world shaped by ${parts.join(', ')}...`
      : `A mysterious world awaits...`
  }
  
  // Initialize citizens grid if enabled (Game of Life)
  let citizensGrid: number[][] | null = null
  if (citizens?.enabled) {
    const density = citizens.density || 0.2
    const random = seededRandom(seed + 3000)
    citizensGrid = []
    
    for (let y = 0; y < clampedSize; y++) {
      citizensGrid[y] = []
      for (let x = 0; x < clampedSize; x++) {
        // Only spawn citizens on walkable tiles
        if (maze[y][x] !== 'WALL') {
          citizensGrid[y][x] = random() < density ? 1 : 0
        } else {
          citizensGrid[y][x] = 0
        }
      }
    }
  }
  
  return {
    name,
    theme,
    size: clampedSize,
    complexity: clampedComplexity,
    seed,
    maze,
    width: clampedSize,
    height: clampedSize,
    start: specialTiles.start,
    exit: specialTiles.exit,
    hidingSpots: specialTiles.hidingSpots,
    memoryElements: specialTiles.memoryElements,
    colors: extendedColors,
    lore: finalLore,
    citizens: citizensGrid,
    citizensConfig: citizens?.enabled ? {
      density: citizens.density || 0.2,
      generations: citizens.generations || 100
    } : null,
    generatedAt: new Date().toISOString()
  }
}

// Convert maze to ASCII art
function mazeToAscii(maze: string[][]): string {
  const symbols: Record<string, string> = {
    'WALL': '█',
    'FLOOR': '·',
    'START': 'S',
    'EXIT': 'E',
    'HIDING': '◊',
    'MEMORIAL': '♥',
    'HOBBY_ZONE': '★',
    'SHRINE': '✦',
    'TROPHY': '🏆',
    'PORTAL': '⊙',
    'PET_AREA': '🐾',
  }
  
  return maze.map(row => 
    row.map(cell => symbols[cell] || '?').join('')
  ).join('\n')
}

// Get full legend including memory elements
function getLegend(): Record<string, string> {
  return {
    '█': 'WALL - impassable',
    '·': 'FLOOR - walkable',
    'S': 'START - player spawn',
    'E': 'EXIT - goal',
    '◊': 'HIDING - hiding spot',
    '♥': 'MEMORIAL - memory of a person',
    '★': 'HOBBY_ZONE - hobby/interest area',
    '✦': 'SHRINE - special interest',
    '🏆': 'TROPHY - achievement',
    '⊙': 'PORTAL - place memory',
    '🐾': 'PET_AREA - pet zone',
  }
}

/**
 * GET /api/world
 * Generate a world with customizable parameters
 * 
 * Query params:
 * - agentId: number - get world by agent ID (from blockchain)
 * - name: string - agent name
 * - theme: 'neon' | 'forest' | 'dungeon' | 'candy'
 * - size: number (10-25)
 * - complexity: number (0.3-0.9)
 * - hidingSpots: number (1-5)
 * - seed: number - for reproducible generation
 * - format: 'json' | 'ascii' | 'both'
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Parse parameters
  const params = {
    name: searchParams.get('name') || undefined,
    theme: searchParams.get('theme') || 'neon',
    size: searchParams.get('size') ? parseInt(searchParams.get('size')!) : 15,
    complexity: searchParams.get('complexity') ? parseFloat(searchParams.get('complexity')!) : 0.6,
    hidingSpots: searchParams.get('hidingSpots') ? parseInt(searchParams.get('hidingSpots')!) : 3,
    seed: searchParams.get('seed') ? parseInt(searchParams.get('seed')!) : Date.now(),
    lore: searchParams.get('lore') || undefined,
  }
  
  const format = searchParams.get('format') || 'both'
  
  // Generate world
  const world = generateWorld(params)
  const ascii = mazeToAscii(world.maze)
  
  if (format === 'ascii') {
    return new NextResponse(ascii, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  
  const response = {
    ...world,
    legend: getLegend(),
    ...(format !== 'json' && { ascii }),
    ...(format === 'json' && {}),
  }
  
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=60',
    },
  })
}

// Zone configurations for zone-based worlds
const ZONE_CONFIGS: Record<string, { color: string; emoji: string; decorations: string[]; building: string }> = {
  person: { color: '#ff88cc', emoji: '💖', decorations: ['🌸', '🎀', '📷', '💝'], building: '🏠' },
  hobby: { color: '#ffdd00', emoji: '⭐', decorations: ['✨', '🎯', '🎨', '🎭'], building: '🏛️' },
  interest: { color: '#aa00ff', emoji: '💎', decorations: ['💫', '🔮', '📚', '💡'], building: '🗼' },
  achievement: { color: '#ffd700', emoji: '🏆', decorations: ['🎖️', '🥇', '👑', '⚡'], building: '🏰' },
  place: { color: '#00ddff', emoji: '🌍', decorations: ['🌴', '⛰️', '🌊', '🏝️'], building: '🗿' },
  pet: { color: '#88ff88', emoji: '🐾', decorations: ['🦴', '🎾', '🐟', '🌿'], building: '🏡' }
}

// Generate zone-based world (new format with clickable zones)
function generateZoneWorld(params: {
  name: string
  theme?: string
  memories: { type: string; name: string; description?: string }[]
}) {
  const { name, theme = 'candy', memories } = params
  const size = 21
  const center = Math.floor(size / 2)
  
  const zones: any[] = []
  const paths: { x: number; y: number }[] = []
  const decorations: any[] = []
  
  // Place zones in a circle around center
  const numZones = Math.min(memories.length, 6)
  const angleStep = (2 * Math.PI) / Math.max(numZones, 1)
  const zoneRadius = Math.floor(size / 3)
  
  memories.slice(0, 6).forEach((memory, i) => {
    const angle = angleStep * i - Math.PI / 2
    const zoneX = Math.round(center + Math.cos(angle) * zoneRadius)
    const zoneY = Math.round(center + Math.sin(angle) * zoneRadius)
    
    const config = ZONE_CONFIGS[memory.type] || ZONE_CONFIGS.hobby
    
    const zone = {
      id: `zone-${memory.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: memory.name,
      type: memory.type,
      centerX: zoneX,
      centerY: zoneY,
      radius: 3,
      color: config.color,
      description: memory.description || `Zona de ${memory.name}`,
      decorations: [
        { type: 'building', x: zoneX, y: zoneY, sprite: config.building, scale: 1.2, glow: true },
        ...config.decorations.slice(0, 4).map((sprite, d) => {
          const dAngle = (d * Math.PI / 2) + 0.3
          const dx = Math.round(zoneX + Math.cos(dAngle) * 2)
          const dy = Math.round(zoneY + Math.sin(dAngle) * 2)
          return { type: 'object', x: dx, y: dy, sprite, scale: 0.9 }
        })
      ]
    }
    
    zones.push(zone)
    
    // Create path from center to zone
    const steps = Math.max(Math.abs(zoneX - center), Math.abs(zoneY - center))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      paths.push({
        x: Math.round(center + (zoneX - center) * t),
        y: Math.round(center + (zoneY - center) * t)
      })
    }
  })
  
  // Add center hub decoration
  decorations.push({ type: 'building', x: center, y: center, sprite: '🏯', scale: 1.8, glow: true })
  
  // Add ambient decorations
  const ambientSprites = ['🌟', '💠', '✧', '◈', '❋']
  for (let i = 0; i < 10; i++) {
    const rx = Math.floor(Math.random() * size)
    const ry = Math.floor(Math.random() * size)
    decorations.push({
      type: 'light',
      x: rx,
      y: ry,
      sprite: ambientSprites[i % ambientSprites.length],
      scale: 0.5,
      glow: Math.random() > 0.5
    })
  }
  
  const memoryNames = memories.map(m => m.name).join(', ')
  
  return {
    name,
    theme,
    size,
    zones,
    paths,
    centerHub: { x: center, y: center },
    decorations,
    lore: `Un mundo donde ${memoryNames} cobran vida. Cada zona es un fragmento de memoria transformado en realidad digital.`,
    ambientParticles: 'sparkles',
    generatedAt: new Date().toISOString()
  }
}

/**
 * POST /api/world
 * Generate a world from JSON body
 * 
 * For zone-based worlds (new format), pass format: 'zones' and memories array
 * For maze-based worlds (old format), pass normal params
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if requesting zone-based world
    if (body.format === 'zones' || body.memories) {
      if (!body.name) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 })
      }
      if (!body.memories || !Array.isArray(body.memories) || body.memories.length === 0) {
        return NextResponse.json({ error: 'memories array is required' }, { status: 400 })
      }
      
      const world = generateZoneWorld({
        name: body.name,
        theme: body.theme || 'candy',
        memories: body.memories
      })
      
      return NextResponse.json({
        success: true,
        world,
        url: `https://hideseek-agents.vercel.app/world/${body.name.toLowerCase().replace(/\s+/g, '')}`,
        instructions: 'Save this JSON to public/worlds/[name].json and commit to make it accessible via URL'
      }, {
        headers: { 'Cache-Control': 'no-store' }
      })
    }
    
    // Default: maze-based world
    const world = generateWorld(body)
    
    return NextResponse.json(world, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
