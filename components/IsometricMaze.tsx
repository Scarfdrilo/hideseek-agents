'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js'

interface MemoryElement {
  type: string
  tile: string
  name: string
  description?: string
  position?: { x: number; y: number }
}

interface MazeData {
  maze: string[][]
  width: number
  height: number
  hidingSpots: { x: number; y: number }[]
  start?: { x: number; y: number }
  memoryElements?: MemoryElement[]
  citizens?: number[][]
  lore?: string
}

interface IsometricMazeProps {
  data: MazeData
  tileSize?: number
  theme?: 'neon' | 'forest' | 'dungeon' | 'candy' | 'swamp'
  showCitizens?: boolean
}

// Color themes - pixel art style
const THEMES = {
  neon: {
    wall: 0x1a1a2e,
    wallTop: 0x16213e,
    wallSide: 0x0f0f1a,
    floor: 0x0a0a12,
    floorAlt: 0x0d0d18,
    start: 0x00ff88,
    exit: 0xff00aa,
    hiding: 0x00aaff,
    glow: 0x00ffcc,
    bg: 0x050508,
  },
  forest: {
    wall: 0x2d5a27,
    wallTop: 0x3d7a37,
    wallSide: 0x1d3a17,
    floor: 0x1a3015,
    floorAlt: 0x1f3818,
    start: 0x88ff00,
    exit: 0xffaa00,
    hiding: 0x00ccaa,
    glow: 0xaaff00,
    bg: 0x0a1008,
  },
  dungeon: {
    wall: 0x3a3a4a,
    wallTop: 0x4a4a5a,
    wallSide: 0x2a2a3a,
    floor: 0x1a1a22,
    floorAlt: 0x1f1f28,
    start: 0xffcc00,
    exit: 0xff4444,
    hiding: 0x8844ff,
    glow: 0xff8800,
    bg: 0x08080a,
  },
  candy: {
    wall: 0xff88aa,
    wallTop: 0xffaacc,
    wallSide: 0xcc6688,
    floor: 0x442244,
    floorAlt: 0x4a2a4a,
    start: 0x88ffaa,
    exit: 0xffff44,
    hiding: 0x44ffff,
    glow: 0xff88ff,
    bg: 0x220022,
  },
  swamp: {
    wall: 0x1a5530,      // Brighter green walls
    wallTop: 0x2a7540,   // Even brighter top
    wallSide: 0x0a3520,  // Darker side
    floor: 0x0a2510,     // Dark swamp floor
    floorAlt: 0x0c2a12,  // Slightly different
    start: 0x00ff66,     // Bright green start
    exit: 0xff6600,      // Orange exit
    hiding: 0x00ffcc,    // Cyan hiding
    glow: 0x44ff88,      // Green glow
    bg: 0x020a04,        // Very dark green bg
  },
}

// Memory element colors - BRIGHT and visible!
const MEMORY_COLORS = {
  MEMORIAL: 0xff44aa,    // Hot pink heart
  HOBBY_ZONE: 0xffdd00,  // Bright yellow star
  SHRINE: 0xdd00ff,      // Bright purple diamond
  TROPHY: 0xffd700,      // Gold trophy
  PORTAL: 0x00eeff,      // Bright cyan portal
  PET_AREA: 0x44ff44,    // Bright green paw
}

// Citizen color (Game of Life cells) - pulsing green
const CITIZEN_COLOR = 0x00ff88

// Convert cartesian to isometric
function toIso(x: number, y: number, tileW: number, tileH: number): { x: number; y: number } {
  return {
    x: (x - y) * (tileW / 2),
    y: (x + y) * (tileH / 2),
  }
}

export default function IsometricMaze({ data, tileSize = 32, theme = 'neon', showCitizens = false }: IsometricMazeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [playerPos, setPlayerPos] = useState(data.start || { x: 1, y: 1 })
  const [citizensState, setCitizensState] = useState<number[][] | null>(data.citizens || null)
  
  const colors = THEMES[theme] || THEMES.neon
  const tileW = tileSize
  const tileH = tileSize / 2
  const wallHeight = tileSize * 0.8

  const drawTile = useCallback((
    g: Graphics, 
    screenX: number, 
    screenY: number, 
    color: number,
    isWall: boolean = false
  ) => {
    if (isWall) {
      // Draw wall (3D block)
      // Top face
      g.fill({ color: colors.wallTop })
      g.poly([
        screenX, screenY - wallHeight,
        screenX + tileW / 2, screenY - wallHeight + tileH / 2,
        screenX, screenY - wallHeight + tileH,
        screenX - tileW / 2, screenY - wallHeight + tileH / 2,
      ])
      g.fill()
      
      // Left face
      g.fill({ color: colors.wallSide })
      g.poly([
        screenX - tileW / 2, screenY - wallHeight + tileH / 2,
        screenX, screenY - wallHeight + tileH,
        screenX, screenY + tileH,
        screenX - tileW / 2, screenY + tileH / 2,
      ])
      g.fill()
      
      // Right face
      g.fill({ color: colors.wall })
      g.poly([
        screenX + tileW / 2, screenY - wallHeight + tileH / 2,
        screenX, screenY - wallHeight + tileH,
        screenX, screenY + tileH,
        screenX + tileW / 2, screenY + tileH / 2,
      ])
      g.fill()
    } else {
      // Draw floor tile (diamond)
      g.fill({ color })
      g.poly([
        screenX, screenY,
        screenX + tileW / 2, screenY + tileH / 2,
        screenX, screenY + tileH,
        screenX - tileW / 2, screenY + tileH / 2,
      ])
      g.fill()
    }
  }, [colors, tileW, tileH, wallHeight])

  const drawPlayer = useCallback((g: Graphics, screenX: number, screenY: number) => {
    // Simple pixel art character
    const s = tileSize / 8
    
    // Shadow
    g.fill({ color: 0x000000, alpha: 0.3 })
    g.ellipse(screenX, screenY + tileH / 2 + s, s * 3, s * 1.5)
    g.fill()
    
    // Body
    g.fill({ color: colors.start })
    g.rect(screenX - s * 2, screenY - s * 6, s * 4, s * 4)
    g.fill()
    
    // Head
    g.fill({ color: 0xffcc88 })
    g.rect(screenX - s * 1.5, screenY - s * 10, s * 3, s * 3)
    g.fill()
    
    // Eyes
    g.fill({ color: 0x000000 })
    g.rect(screenX - s, screenY - s * 8.5, s * 0.5, s * 0.5)
    g.rect(screenX + s * 0.5, screenY - s * 8.5, s * 0.5, s * 0.5)
    g.fill()
  }, [colors, tileSize, tileH])

  useEffect(() => {
    if (!containerRef.current) return

    const app = new Application()
    
    const init = async () => {
      await app.init({
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight,
        backgroundColor: colors.bg,
        antialias: false, // Pixel art style
        resolution: window.devicePixelRatio || 1,
      })
      
      containerRef.current!.appendChild(app.canvas)
      appRef.current = app

      // Main container for the maze
      const mazeContainer = new Container()
      app.stage.addChild(mazeContainer)
      
      // Center the maze
      const centerX = app.screen.width / 2
      const centerY = app.screen.height / 4
      
      const graphics = new Graphics()
      mazeContainer.addChild(graphics)
      
      // Draw maze
      const { maze, width, height } = data
      
      // Draw from back to front (painter's algorithm)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = maze[y][x]
          const iso = toIso(x, y, tileW, tileH)
          const screenX = centerX + iso.x
          const screenY = centerY + iso.y
          
          if (cell === 'WALL') {
            drawTile(graphics, screenX, screenY, colors.wall, true)
          } else {
            // Floor
            const floorColor = (x + y) % 2 === 0 ? colors.floor : colors.floorAlt
            drawTile(graphics, screenX, screenY, floorColor, false)
            
            // Special tiles
            if (cell === 'START') {
              // Glow effect
              graphics.fill({ color: colors.start, alpha: 0.3 })
              graphics.circle(screenX, screenY + tileH / 2, tileSize / 3)
              graphics.fill()
            } else if (cell === 'EXIT') {
              graphics.fill({ color: colors.exit, alpha: 0.5 })
              graphics.circle(screenX, screenY + tileH / 2, tileSize / 3)
              graphics.fill()
            } else if (cell === 'HIDING') {
              // Crystal/gem
              graphics.fill({ color: colors.hiding })
              graphics.poly([
                screenX, screenY - tileSize / 4,
                screenX + tileSize / 6, screenY + tileH / 4,
                screenX, screenY + tileH / 2,
                screenX - tileSize / 6, screenY + tileH / 4,
              ])
              graphics.fill()
            } else if (cell === 'MEMORIAL') {
              // HEART - person memory (BIG and glowing)
              // Glow effect
              graphics.fill({ color: MEMORY_COLORS.MEMORIAL, alpha: 0.3 })
              graphics.circle(screenX, screenY, tileSize / 2)
              graphics.fill()
              // Heart shape
              graphics.fill({ color: MEMORY_COLORS.MEMORIAL, alpha: 1 })
              graphics.circle(screenX - tileSize / 5, screenY - tileSize / 6, tileSize / 4)
              graphics.circle(screenX + tileSize / 5, screenY - tileSize / 6, tileSize / 4)
              graphics.poly([
                screenX - tileSize / 2.5, screenY - tileSize / 10,
                screenX + tileSize / 2.5, screenY - tileSize / 10,
                screenX, screenY + tileH,
              ])
              graphics.fill()
            } else if (cell === 'HOBBY_ZONE') {
              // STAR - hobbies (BIG golden star)
              // Glow effect
              graphics.fill({ color: MEMORY_COLORS.HOBBY_ZONE, alpha: 0.3 })
              graphics.circle(screenX, screenY + tileH / 4, tileSize / 2)
              graphics.fill()
              // Star shape
              graphics.fill({ color: MEMORY_COLORS.HOBBY_ZONE, alpha: 1 })
              const starPoints: number[] = []
              for (let i = 0; i < 10; i++) {
                const radius = i % 2 === 0 ? tileSize / 2.5 : tileSize / 5
                const angle = (i * Math.PI) / 5 - Math.PI / 2
                starPoints.push(screenX + Math.cos(angle) * radius)
                starPoints.push(screenY + Math.sin(angle) * radius + tileH / 4)
              }
              graphics.poly(starPoints)
              graphics.fill()
            } else if (cell === 'SHRINE') {
              // DIAMOND - interests (BIG purple gem)
              // Glow effect
              graphics.fill({ color: MEMORY_COLORS.SHRINE, alpha: 0.3 })
              graphics.circle(screenX, screenY + tileH / 4, tileSize / 2)
              graphics.fill()
              // Diamond
              graphics.fill({ color: MEMORY_COLORS.SHRINE, alpha: 1 })
              graphics.poly([
                screenX, screenY - tileSize / 3,
                screenX + tileSize / 3, screenY + tileH / 4,
                screenX, screenY + tileH + tileSize / 6,
                screenX - tileSize / 3, screenY + tileH / 4,
              ])
              graphics.fill()
            } else if (cell === 'TROPHY') {
              // TROPHY - achievements (golden cup)
              // Glow effect
              graphics.fill({ color: MEMORY_COLORS.TROPHY, alpha: 0.3 })
              graphics.circle(screenX, screenY, tileSize / 2)
              graphics.fill()
              // Cup
              graphics.fill({ color: MEMORY_COLORS.TROPHY, alpha: 1 })
              graphics.rect(screenX - tileSize / 4, screenY - tileSize / 4, tileSize / 2, tileSize / 2.5)
              graphics.rect(screenX - tileSize / 6, screenY + tileSize / 6, tileSize / 3, tileSize / 6)
              graphics.fill()
            } else if (cell === 'PORTAL') {
              // PORTAL - swirling cyan (animated feel)
              // Outer glow
              graphics.fill({ color: MEMORY_COLORS.PORTAL, alpha: 0.2 })
              graphics.circle(screenX, screenY + tileH / 4, tileSize / 2)
              graphics.fill()
              // Rings
              graphics.fill({ color: MEMORY_COLORS.PORTAL, alpha: 0.8 })
              graphics.circle(screenX, screenY + tileH / 4, tileSize / 3)
              graphics.fill({ color: 0x004466, alpha: 1 })
              graphics.circle(screenX, screenY + tileH / 4, tileSize / 5)
              graphics.fill({ color: 0x000033, alpha: 1 })
              graphics.circle(screenX, screenY + tileH / 4, tileSize / 10)
              graphics.fill()
            } else if (cell === 'PET_AREA') {
              // PAW PRINT - pets
              // Glow
              graphics.fill({ color: MEMORY_COLORS.PET_AREA, alpha: 0.3 })
              graphics.circle(screenX, screenY + tileH / 4, tileSize / 2)
              graphics.fill()
              // Main pad
              graphics.fill({ color: MEMORY_COLORS.PET_AREA, alpha: 1 })
              graphics.circle(screenX, screenY + tileH / 6, tileSize / 4)
              // Toe pads
              graphics.circle(screenX - tileSize / 5, screenY - tileSize / 6, tileSize / 7)
              graphics.circle(screenX + tileSize / 5, screenY - tileSize / 6, tileSize / 7)
              graphics.circle(screenX - tileSize / 8, screenY - tileSize / 3, tileSize / 8)
              graphics.circle(screenX + tileSize / 8, screenY - tileSize / 3, tileSize / 8)
              graphics.fill()
            }
            
            // Draw citizen if present (Game of Life)
            if (showCitizens && citizensState && citizensState[y]?.[x] === 1) {
              graphics.fill({ color: CITIZEN_COLOR, alpha: 0.7 })
              graphics.circle(screenX, screenY + tileH / 4, tileSize / 5)
              graphics.fill()
            }
          }
        }
      }
      
      // Draw player
      const playerIso = toIso(playerPos.x, playerPos.y, tileW, tileH)
      drawPlayer(graphics, centerX + playerIso.x, centerY + playerIso.y)
      
      // Title
      const titleStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 24,
        fill: colors.glow,
        dropShadow: {
          color: colors.glow,
          blur: 10,
          distance: 0,
        },
      })
      const title = new Text({ text: '🎮 HideSeek - Isometric Preview', style: titleStyle })
      title.x = 20
      title.y = 20
      app.stage.addChild(title)
      
      // Theme label
      const labelStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 14,
        fill: 0xaaaaaa,
      })
      const label = new Text({ text: `Theme: ${theme} | WASD to move`, style: labelStyle })
      label.x = 20
      label.y = app.screen.height - 40
      app.stage.addChild(label)
    }
    
    init()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
    }
  }, [data, colors, theme, tileW, tileH, wallHeight, drawTile, drawPlayer, playerPos, citizensState, showCitizens])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { maze } = data
      let newX = playerPos.x
      let newY = playerPos.y
      
      switch (e.key.toLowerCase()) {
        case 'w': newY--; break
        case 's': newY++; break
        case 'a': newX--; break
        case 'd': newX++; break
        default: return
      }
      
      // Check bounds and walls
      if (
        newX >= 0 && newX < data.width &&
        newY >= 0 && newY < data.height &&
        maze[newY][newX] !== 'WALL'
      ) {
        setPlayerPos({ x: newX, y: newY })
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [data, playerPos])

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '500px',
        background: `#${colors.bg.toString(16).padStart(6, '0')}`,
      }} 
    />
  )
}
