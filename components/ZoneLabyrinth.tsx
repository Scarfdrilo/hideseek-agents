'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js'

interface ZoneData {
  id: string
  name: string
  type: string
  color: string
  description?: string
  decorations: { type: string; x: number; y: number; sprite: string; scale?: number }[]
}

interface ZoneLabyrinthProps {
  zone: ZoneData
  onClose: () => void
}

// Generate a geometric labyrinth for a zone
function generateZoneMaze(seed: string, size: number = 11): string[][] {
  const maze: string[][] = []
  
  // Seeded random from zone id
  let s = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 9999
  const random = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  
  // Initialize with walls
  for (let y = 0; y < size; y++) {
    maze[y] = []
    for (let x = 0; x < size; x++) {
      maze[y][x] = 'WALL'
    }
  }
  
  // DFS maze generation
  const stack: [number, number][] = []
  maze[1][1] = 'FLOOR'
  stack.push([1, 1])
  
  const directions = [[0, -2], [0, 2], [-2, 0], [2, 0]]
  
  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1]
    const shuffled = [...directions].sort(() => random() - 0.5)
    let carved = false
    
    for (const [dx, dy] of shuffled) {
      const nx = cx + dx
      const ny = cy + dy
      
      if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx] === 'WALL') {
        maze[cy + dy / 2][cx + dx / 2] = 'FLOOR'
        maze[ny][nx] = 'FLOOR'
        stack.push([nx, ny])
        carved = true
        break
      }
    }
    
    if (!carved) stack.pop()
  }
  
  // Mark start and exit
  maze[1][1] = 'START'
  maze[size - 2][size - 2] = 'EXIT'
  
  return maze
}

// Get themed objects for each zone type
function getZoneObjects(type: string): string[] {
  const objects: Record<string, string[]> = {
    person: ['💖', '📷', '🌸', '💝', '🎀', '💌'],
    hobby: ['⭐', '✨', '🎨', '🧵', '🪡', '🎯'],
    interest: ['💎', '💡', '📚', '🔮', '⚡', '💫'],
    achievement: ['🏆', '👑', '🥇', '🎖️', '⚡', '🌟'],
    place: ['🌴', '🏝️', '⛰️', '🌊', '🌺', '🦋'],
    pet: ['🐾', '🦴', '🎾', '🐟', '🌿', '❤️']
  }
  return objects[type] || objects.hobby
}

export default function ZoneLabyrinth({ zone, onClose }: ZoneLabyrinthProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 })
  const mazeRef = useRef<string[][]>([])
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [joystickActive, setJoystickActive] = useState(false)
  const [joystickDir, setJoystickDir] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  
  const zoneColor = parseInt(zone.color.replace('#', ''), 16)
  const tileSize = 40
  const mazeSize = 11
  
  // Generate maze once
  useEffect(() => {
    mazeRef.current = generateZoneMaze(zone.id, mazeSize)
  }, [zone.id])

  // Handle keyboard movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const maze = mazeRef.current
      if (!maze.length) return
      
      let dx = 0, dy = 0
      
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': dy = -1; break
        case 's': case 'arrowdown': dy = 1; break
        case 'a': case 'arrowleft': dx = -1; break
        case 'd': case 'arrowright': dx = 1; break
        case 'escape': onClose(); return
      }
      
      if (dx !== 0 || dy !== 0) {
        e.preventDefault()
        setPlayerPos(prev => {
          const newX = prev.x + dx
          const newY = prev.y + dy
          
          // Check bounds and walls
          if (newY >= 0 && newY < maze.length && 
              newX >= 0 && newX < maze[0].length &&
              maze[newY][newX] !== 'WALL') {
            
            // Check if reached exit
            if (maze[newY][newX] === 'EXIT') {
              setTimeout(() => {
                alert(`🎉 ¡Completaste el laberinto de ${zone.name}!`)
                onClose()
              }, 100)
            }
            
            return { x: newX, y: newY }
          }
          return prev
        })
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zone.name, onClose])

  // Handle joystick movement
  useEffect(() => {
    if (!joystickActive || (joystickDir.x === 0 && joystickDir.y === 0)) return
    
    const interval = setInterval(() => {
      const maze = mazeRef.current
      if (!maze.length) return
      
      const dx = joystickDir.x > 0.3 ? 1 : joystickDir.x < -0.3 ? -1 : 0
      const dy = joystickDir.y > 0.3 ? 1 : joystickDir.y < -0.3 ? -1 : 0
      
      if (dx !== 0 || dy !== 0) {
        setPlayerPos(prev => {
          const newX = prev.x + dx
          const newY = prev.y + dy
          
          if (newY >= 0 && newY < maze.length && 
              newX >= 0 && newX < maze[0].length &&
              maze[newY][newX] !== 'WALL') {
            
            if (maze[newY][newX] === 'EXIT') {
              setTimeout(() => {
                alert(`🎉 ¡Completaste el laberinto de ${zone.name}!`)
                onClose()
              }, 100)
            }
            
            return { x: newX, y: newY }
          }
          return prev
        })
      }
    }, 150)
    
    return () => clearInterval(interval)
  }, [joystickActive, joystickDir, zone.name, onClose])

  // Render the labyrinth
  useEffect(() => {
    if (!containerRef.current) return
    
    const maze = mazeRef.current
    if (!maze.length) return

    const initApp = async () => {
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }

      const app = new Application()
      await app.init({
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight - 100,
        backgroundColor: 0x0a0a12,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      containerRef.current!.querySelector('.maze-canvas')?.remove()
      const canvas = app.canvas as HTMLCanvasElement
      canvas.className = 'maze-canvas'
      containerRef.current!.appendChild(canvas)
      appRef.current = app

      const worldContainer = new Container()
      app.stage.addChild(worldContainer)

      // Center the maze
      const mazeWidth = mazeSize * tileSize
      const mazeHeight = mazeSize * tileSize
      worldContainer.position.set(
        (app.screen.width - mazeWidth) / 2,
        (app.screen.height - mazeHeight) / 2
      )

      const graphics = new Graphics()
      worldContainer.addChild(graphics)

      // Get zone-specific objects
      const zoneObjects = getZoneObjects(zone.type)
      let objectIndex = 0

      // Draw maze
      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
          const cell = maze[y][x]
          const screenX = x * tileSize
          const screenY = y * tileSize
          
          if (cell === 'WALL') {
            // Wall - zone color
            graphics.fill({ color: zoneColor, alpha: 0.8 })
            graphics.roundRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4, 4)
            graphics.fill()
            
            // Inner highlight
            graphics.fill({ color: 0xffffff, alpha: 0.1 })
            graphics.roundRect(screenX + 4, screenY + 4, tileSize - 12, tileSize - 12, 2)
            graphics.fill()
          } else {
            // Floor - dark
            graphics.fill({ color: 0x1a1a2e, alpha: 0.6 })
            graphics.roundRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2, 2)
            graphics.fill()
            
            // Randomly place zone objects on some floor tiles
            if (cell === 'FLOOR' && Math.random() > 0.85) {
              const obj = zoneObjects[objectIndex % zoneObjects.length]
              objectIndex++
              
              const objStyle = new TextStyle({
                fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
                fontSize: 20,
              })
              const objText = new Text({ text: obj, style: objStyle })
              objText.anchor.set(0.5)
              objText.position.set(screenX + tileSize / 2, screenY + tileSize / 2)
              worldContainer.addChild(objText)
            }
          }
          
          // Start marker
          if (cell === 'START') {
            graphics.fill({ color: 0x00ff88, alpha: 0.3 })
            graphics.circle(screenX + tileSize / 2, screenY + tileSize / 2, tileSize / 3)
            graphics.fill()
          }
          
          // Exit marker
          if (cell === 'EXIT') {
            graphics.fill({ color: 0xffaa00, alpha: 0.5 })
            graphics.circle(screenX + tileSize / 2, screenY + tileSize / 2, tileSize / 3)
            graphics.fill()
            
            const exitStyle = new TextStyle({
              fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
              fontSize: 24,
            })
            const exitText = new Text({ text: '🚪', style: exitStyle })
            exitText.anchor.set(0.5)
            exitText.position.set(screenX + tileSize / 2, screenY + tileSize / 2)
            worldContainer.addChild(exitText)
          }
        }
      }

      // Draw player
      const playerContainer = new Container()
      worldContainer.addChild(playerContainer)
      
      const drawPlayer = () => {
        playerContainer.removeChildren()
        
        const playerGraphics = new Graphics()
        const px = playerPos.x * tileSize + tileSize / 2
        const py = playerPos.y * tileSize + tileSize / 2
        
        // Glow
        playerGraphics.fill({ color: 0x00ff88, alpha: 0.3 })
        playerGraphics.circle(px, py, tileSize / 2)
        playerGraphics.fill()
        
        // Player body
        playerGraphics.fill({ color: 0x00ff88, alpha: 1 })
        playerGraphics.circle(px, py, tileSize / 3)
        playerGraphics.fill()
        
        playerContainer.addChild(playerGraphics)
      }
      
      drawPlayer()
      
      // Update player position on state change
      app.ticker.add(() => {
        drawPlayer()
      })
    }

    initApp()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
    }
  }, [zone, zoneColor, playerPos, tileSize])

  // Joystick handlers - Fixed for Safari iOS
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.preventDefault() // Prevent scroll on Safari
    e.stopPropagation()
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setJoystickActive(true)
  }

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.preventDefault() // Prevent scroll on Safari
    e.stopPropagation()
    if (!touchStart) return
    const touch = e.touches[0]
    const dx = (touch.clientX - touchStart.x) / 50
    const dy = (touch.clientY - touchStart.y) / 50
    setJoystickDir({ 
      x: Math.max(-1, Math.min(1, dx)), 
      y: Math.max(-1, Math.min(1, dy)) 
    })
  }

  const handleJoystickEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTouchStart(null)
    setJoystickActive(false)
    setJoystickDir({ x: 0, y: 0 })
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: `2px solid ${zone.color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.8)',
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            color: zone.color,
            fontFamily: 'monospace',
            fontSize: '24px',
          }}>
            {zone.name}
          </h2>
          {zone.description && (
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '14px' }}>
              {zone.description}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: `1px solid ${zone.color}`,
            color: zone.color,
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
        >
          ✕ CERRAR (ESC)
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        padding: '8px 24px',
        background: 'rgba(0,0,0,0.5)',
        color: '#888',
        fontSize: '12px',
        fontFamily: 'monospace',
        textAlign: 'center',
      }}>
        🎮 WASD o ↑↓←→ para moverte | Llega a la 🚪 para completar
      </div>

      {/* Maze container */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1,
          position: 'relative',
        }}
      />

      {/* Mobile Joystick - Safari iOS compatible */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          border: `3px solid ${zone.color}`,
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        {/* Joystick knob */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: zone.color,
            boxShadow: `0 0 20px ${zone.color}`,
            transform: `translate(${-30 + joystickDir.x * 25}px, ${-30 + joystickDir.y * 25}px)`,
            opacity: joystickActive ? 1 : 0.6,
            transition: joystickActive ? 'none' : 'transform 0.2s',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Mobile direction hints */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '0',
        right: '0',
        textAlign: 'center',
        color: '#666',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}>
        📱 Arrastra el joystick para moverte
      </div>
    </div>
  )
}
