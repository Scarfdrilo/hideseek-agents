import { NextRequest, NextResponse } from 'next/server'

// DFS Maze generator (same as frontend)
function generateMaze(seed?: number) {
  const size = 25
  const maze: string[][] = []
  
  // Simple seeded random
  let s = seed || Date.now()
  const random = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  
  // Initialize all as walls
  for (let y = 0; y < size; y++) {
    maze[y] = []
    for (let x = 0; x < size; x++) {
      maze[y][x] = 'WALL'
    }
  }
  
  // DFS carving
  const stack: [number, number][] = []
  const startX = 1
  const startZ = 1
  maze[startZ][startX] = 'FLOOR'
  stack.push([startX, startZ])
  
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
    
    if (!carved) {
      stack.pop()
    }
  }
  
  // Find start position
  let startPosX = Math.floor(size / 2)
  let startPosZ = Math.floor(size / 2)
  for (let r = 0; r < 5; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const tx = startPosX + dx
        const tz = startPosZ + dy
        if (tx > 0 && tx < size && tz > 0 && tz < size && maze[tz][tx] === 'FLOOR') {
          maze[tz][tx] = 'START'
          startPosX = tx
          startPosZ = tz
          break
        }
      }
    }
  }
  
  // Add hiding spots
  const hidingSpots: { x: number; y: number }[] = []
  for (let attempts = 0; attempts < 50 && hidingSpots.length < 5; attempts++) {
    const x = Math.floor(random() * (size - 2)) + 1
    const y = Math.floor(random() * (size - 2)) + 1
    if (maze[y][x] === 'FLOOR') {
      maze[y][x] = 'HIDING'
      hidingSpots.push({ x, y })
    }
  }
  
  // Add exit
  for (let attempts = 0; attempts < 100; attempts++) {
    const x = Math.floor(random() * (size - 2)) + 1
    const y = Math.floor(random() * (size - 2)) + 1
    const dist = Math.sqrt((x - startPosX) ** 2 + (y - startPosZ) ** 2)
    if (maze[y][x] === 'FLOOR' && dist > size / 3) {
      maze[y][x] = 'EXIT'
      break
    }
  }
  
  return { maze, width: size, height: size, hidingSpots, start: { x: startPosX, y: startPosZ } }
}

// Convert maze to ASCII art
function mazeToAscii(maze: string[][]): string {
  const symbols: Record<string, string> = {
    'WALL': '█',
    'FLOOR': '·',
    'START': 'S',
    'EXIT': 'E',
    'HIDING': '◊',
  }
  
  return maze.map(row => 
    row.map(cell => symbols[cell] || '?').join('')
  ).join('\n')
}

/**
 * GET /api/world
 * Generate a random world or get world by seed
 * 
 * Query params:
 * - seed: number (optional) - deterministic generation
 * - format: 'json' | 'ascii' | 'both' (default: 'both')
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const seedParam = searchParams.get('seed')
  const format = searchParams.get('format') || 'both'
  
  const seed = seedParam ? parseInt(seedParam, 10) : undefined
  const world = generateMaze(seed)
  
  const ascii = mazeToAscii(world.maze)
  
  if (format === 'ascii') {
    return new NextResponse(ascii, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  
  const response = {
    seed: seed || 'random',
    size: { width: world.width, height: world.height },
    start: world.start,
    hidingSpots: world.hidingSpots,
    legend: {
      '█': 'WALL - impassable',
      '·': 'FLOOR - walkable',
      'S': 'START - player spawn',
      'E': 'EXIT - goal',
      '◊': 'HIDING - hiding spot',
    },
    ...(format !== 'json' && { ascii }),
    ...(format === 'json' && { maze: world.maze }),
  }
  
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=60',
    },
  })
}
