'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const IsometricMaze = dynamic(() => import('@/components/IsometricMaze'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      background: '#050508',
      color: '#00ff88',
      fontFamily: 'monospace',
    }}>
      Loading isometric engine...
    </div>
  ),
})

// Same maze generator as API
function generateMaze(seed?: number) {
  const size = 15 // Smaller for isometric view
  const maze: string[][] = []
  
  let s = seed || Date.now()
  const random = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  
  for (let y = 0; y < size; y++) {
    maze[y] = []
    for (let x = 0; x < size; x++) {
      maze[y][x] = 'WALL'
    }
  }
  
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
  
  // Start position
  let startX = 1, startY = 1
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (maze[y][x] === 'FLOOR') {
        maze[y][x] = 'START'
        startX = x
        startY = y
        break
      }
    }
    if (maze[startY][startX] === 'START') break
  }
  
  // Hiding spots
  const hidingSpots: { x: number; y: number }[] = []
  for (let attempts = 0; attempts < 30 && hidingSpots.length < 3; attempts++) {
    const x = Math.floor(random() * (size - 2)) + 1
    const y = Math.floor(random() * (size - 2)) + 1
    if (maze[y][x] === 'FLOOR') {
      maze[y][x] = 'HIDING'
      hidingSpots.push({ x, y })
    }
  }
  
  // Exit
  for (let attempts = 0; attempts < 50; attempts++) {
    const x = Math.floor(random() * (size - 2)) + 1
    const y = Math.floor(random() * (size - 2)) + 1
    const dist = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2)
    if (maze[y][x] === 'FLOOR' && dist > size / 3) {
      maze[y][x] = 'EXIT'
      break
    }
  }
  
  return { maze, width: size, height: size, hidingSpots, start: { x: startX, y: startY } }
}

type Theme = 'neon' | 'forest' | 'dungeon' | 'candy'

export default function IsometricPage() {
  const [theme, setTheme] = useState<Theme>('neon')
  const [seed, setSeed] = useState(12345)
  const [mazeData, setMazeData] = useState(() => generateMaze(12345))

  const regenerate = () => {
    const newSeed = Date.now()
    setSeed(newSeed)
    setMazeData(generateMaze(newSeed))
  }

  const themes: Theme[] = ['neon', 'forest', 'dungeon', 'candy']

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#050508',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Controls */}
      <div style={{
        padding: '16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.5)',
        borderBottom: '1px solid #333',
      }}>
        <span style={{ color: '#888', fontFamily: 'monospace' }}>Theme:</span>
        {themes.map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            style={{
              padding: '8px 16px',
              background: theme === t ? '#00ff88' : '#222',
              color: theme === t ? '#000' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={regenerate}
          style={{
            padding: '8px 16px',
            background: '#ff00aa',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          🎲 New Maze
        </button>
        <span style={{ color: '#666', fontFamily: 'monospace', fontSize: '12px' }}>
          Seed: {seed}
        </span>
      </div>

      {/* Maze */}
      <div style={{ flex: 1 }}>
        <IsometricMaze data={mazeData} theme={theme} tileSize={40} />
      </div>
    </div>
  )
}
