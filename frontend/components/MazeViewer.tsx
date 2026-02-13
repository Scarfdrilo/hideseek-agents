'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useEffect, useState, useRef } from 'react'
import Maze3D from './Maze3DOptimized'
import { Vector3 } from 'three'

// DFS Maze generator for proper labyrinth
const generateMaze = () => {
  const size = 25 // Odd number for proper maze
  const maze: string[][] = []
  
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
  
  const directions = [
    [0, -2], [0, 2], [-2, 0], [2, 0]
  ]
  
  const shuffle = <T,>(arr: T[]): T[] => {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
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
        // Carve passage
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
  
  // Set start position (center-ish)
  const centerX = Math.floor(size / 2)
  const centerZ = Math.floor(size / 2)
  // Find nearest floor to center
  let startPosX = centerX
  let startPosZ = centerZ
  for (let r = 0; r < 5; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const tx = centerX + dx
        const tz = centerZ + dy
        if (tx > 0 && tx < size && tz > 0 && tz < size && maze[tz][tx] === 'FLOOR') {
          startPosX = tx
          startPosZ = tz
          maze[tz][tx] = 'START'
          r = 100 // break outer loops
          break
        }
      }
    }
  }
  
  // Place hiding spots in far corners
  const hidingSpots: {x: number, y: number}[] = []
  const corners = [
    [3, 3], [3, size - 4], [size - 4, 3], [size - 4, size - 4],
    [size / 2, 3], [size / 2, size - 4]
  ]
  
  for (const [tx, tz] of corners) {
    // Find nearest floor
    for (let r = 0; r < 4; r++) {
      let found = false
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          const fx = Math.floor(tx + dx)
          const fz = Math.floor(tz + dy)
          if (fx > 0 && fx < size && fz > 0 && fz < size && maze[fz][fx] === 'FLOOR') {
            maze[fz][fx] = 'HIDING_SPOT'
            hidingSpots.push({ x: fx, y: fz })
            found = true
          }
        }
      }
      if (found) break
    }
  }
  
  return { maze, width: size, height: size, hidingSpots, startPos: { x: startPosX, z: startPosZ } }
}

// Player component
function Player({ position, movement, onPositionChange }: any) {
  const meshRef = useRef<any>(null)
  const speed = 0.15

  useFrame(() => {
    if (!meshRef.current) return

    const moveX = movement.right * speed
    const moveZ = -movement.forward * speed

    meshRef.current.position.x += moveX
    meshRef.current.position.z += moveZ

    if (onPositionChange) {
      onPositionChange([
        meshRef.current.position.x,
        meshRef.current.position.y,
        meshRef.current.position.z
      ])
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
      <meshStandardMaterial 
        color="#00ccff" 
        emissive="#00ccff" 
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}

// Camera follower
function CameraRig({ target }: { target: [number, number, number] }) {
  const { camera } = useThree()
  
  useFrame(() => {
    const idealOffset = new Vector3(0, 8, 8)
    const idealLookAt = new Vector3(target[0], target[1], target[2])
    
    const t = 0.1
    camera.position.lerp(
      idealLookAt.clone().add(idealOffset),
      t
    )
    camera.lookAt(idealLookAt)
  })

  return null
}

export default function MazeViewer() {
  const [mazeData, setMazeData] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([10, 1, 10])
  const [movement, setMovement] = useState({ forward: 0, right: 0 })
  const [score, setScore] = useState(0)
  const [foundSpots, setFoundSpots] = useState<Set<string>>(new Set())
  const [quality, setQuality] = useState<'auto' | 'low' | 'high'>('auto')
  const keysPressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    const data = generateMaze()
    setMazeData(data)
    // Set initial player position to maze start
    if (data.startPos) {
      setPlayerPos([data.startPos.x - data.width / 2, 1, data.startPos.z - data.height / 2])
    }
    
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())
      updateMovement()
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
      updateMovement()
    }
    
    const updateMovement = () => {
      const keys = keysPressed.current
      setMovement({
        forward: (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0),
        right: (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0)
      })
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Check if player found a hiding spot
  useEffect(() => {
    if (!mazeData) return
    
    mazeData.hidingSpots.forEach((spot: any) => {
      const dx = playerPos[0] - spot.x
      const dz = playerPos[2] - spot.y
      const distance = Math.sqrt(dx * dx + dz * dz)
      
      const spotKey = `${spot.x},${spot.y}`
      if (distance < 1.5 && !foundSpots.has(spotKey)) {
        setFoundSpots(prev => new Set(Array.from(prev).concat(spotKey)))
        setScore(prev => prev + 100)
      }
    })
  }, [playerPos, mazeData, foundSpots])

  // Virtual joystick handlers
  const handleJoystickMove = (x: number, y: number) => {
    setMovement({ forward: y, right: x })
  }

  if (!mazeData) {
    return <div>Generating maze...</div>
  }

  const allSpotsFound = foundSpots.size === mazeData.hidingSpots.length

  // Quality settings - auto detects mobile
  const effectiveQuality = quality === 'auto' ? (isMobile ? 'low' : 'high') : quality
  const useFog = effectiveQuality === 'high'
  const lightIntensity = effectiveQuality === 'high' ? 0.5 : 0.6
  const ambientIntensity = effectiveQuality === 'high' ? 0.35 : 1.2  // MUCH brighter on mobile
  const bgColor = effectiveQuality === 'high' ? '#050508' : '#151825'  // Lighter bg on mobile

  return (
    <div className="viewer-container">
      <Canvas shadows={false}>
        <PerspectiveCamera makeDefault position={[10, 8, 18]} fov={60} />
        <CameraRig target={playerPos} />
        
        {/* Fog for depth - skip on low quality */}
        {useFog && <fog attach="fog" args={['#050508', 12, 50]} />}
        <color attach="background" args={[bgColor]} />
        
        {/* Lighting - brighter on mobile for visibility */}
        <ambientLight intensity={ambientIntensity} color="#aaccff" />
        <directionalLight position={[5, 15, 5]} intensity={lightIntensity} color="#ffffff" />
        {effectiveQuality === 'high' ? (
          <hemisphereLight args={['#224466', '#112233', 0.3]} />
        ) : (
          <hemisphereLight args={['#446688', '#223344', 0.5]} />
        )}
        
        <Maze3D data={mazeData} brightMode={effectiveQuality === 'low'} />
        <Player 
          position={playerPos} 
          movement={movement}
          onPositionChange={setPlayerPos}
        />
        
        {/* Simple ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#030305" />
        </mesh>
      </Canvas>

      {/* HUD */}
      <div className="hud">
        <div className="score">
          🎯 Score: {score}
        </div>
        <div className="progress">
          📍 {foundSpots.size} / {mazeData.hidingSpots.length}
        </div>
      </div>

      {allSpotsFound && (
        <div className="victory">
          <h2>🎉 ¡GANASTE!</h2>
          <p>Encontraste todos los hiding spots</p>
        </div>
      )}

      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div className="ui-overlay">
          <div className="stats">
            <h3>🎮 HideSeek Agents</h3>
            <p>Encuentra los hiding spots</p>
            <p className="highlight">Score: {score}</p>
          </div>
          <div className="controls">
            <p><strong>Controles:</strong></p>
            {isMobile ? (
              <p>📱 Usa el joystick →</p>
            ) : (
              <>
                <p>⌨️ WASD o flechas</p>
                <p>🎯 Encuentra los puntos verdes</p>
              </>
            )}
          </div>
          <div className="quality-toggle">
            <p><strong>Calidad:</strong></p>
            <select 
              value={quality} 
              onChange={(e) => setQuality(e.target.value as 'auto' | 'low' | 'high')}
              className="quality-select"
            >
              <option value="auto">Auto</option>
              <option value="low">🔋 Lite (móvil)</option>
              <option value="high">✨ Full</option>
            </select>
          </div>
        </div>
      )}

      {/* Virtual joystick for mobile */}
      {isMobile && <VirtualJoystick onMove={handleJoystickMove} />}

      <style jsx>{`
        .viewer-container {
          width: 100vw;
          height: 100vh;
          position: relative;
        }

        .hud {
          position: absolute;
          top: 15px;
          right: 15px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .score, .progress {
          background: rgba(0, 0, 0, 0.8);
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          border: 2px solid #00ff88;
          color: #00ff88;
          font-size: 1.1rem;
          font-weight: bold;
        }

        .victory {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 300;
          background: rgba(0, 0, 0, 0.95);
          padding: 3rem;
          border-radius: 20px;
          border: 3px solid #00ff88;
          text-align: center;
          animation: victoryPop 0.5s ease-out;
        }

        @keyframes victoryPop {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }

        .victory h2 {
          color: #00ff88;
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .victory p {
          color: #ccc;
          font-size: 1.2rem;
        }

        .menu-toggle {
          position: absolute;
          top: 15px;
          left: 15px;
          z-index: 200;
          background: rgba(0, 255, 136, 0.9);
          border: none;
          border-radius: 8px;
          width: 45px;
          height: 45px;
          font-size: 24px;
          color: #000;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .ui-overlay {
          position: absolute;
          top: 70px;
          left: 15px;
          z-index: 100;
          background: rgba(0, 0, 0, 0.9);
          padding: 1rem;
          border-radius: 10px;
          border: 2px solid #00ff88;
          max-width: 260px;
          animation: slideIn 0.2s;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .stats h3 {
          margin-bottom: 0.5rem;
          color: #00ff88;
          font-size: 1rem;
        }

        .stats p {
          margin: 0.25rem 0;
          color: #ccc;
          font-size: 0.9rem;
        }

        .stats p.highlight {
          color: #00ff88;
          font-weight: bold;
        }

        .controls {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #333;
          color: #888;
          font-size: 0.85rem;
        }

        .controls p {
          margin: 0.25rem 0;
        }

        .quality-toggle {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #333;
        }

        .quality-toggle p {
          color: #888;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .quality-select {
          width: 100%;
          padding: 0.5rem;
          background: #222;
          border: 1px solid #00ff88;
          border-radius: 5px;
          color: #00ff88;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .quality-select:focus {
          outline: none;
          border-color: #00ffcc;
        }
      `}</style>
    </div>
  )
}

// Virtual Joystick Component
function VirtualJoystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const baseRef = useRef<HTMLDivElement>(null)

  const handleStart = (clientX: number, clientY: number) => {
    setDragging(true)
    updatePosition(clientX, clientY)
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragging) return
    updatePosition(clientX, clientY)
  }

  const handleEnd = () => {
    setDragging(false)
    setPosition({ x: 0, y: 0 })
    onMove(0, 0)
  }

  const updatePosition = (clientX: number, clientY: number) => {
    if (!baseRef.current) return
    
    const rect = baseRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    let x = (clientX - centerX) / 50
    let y = (clientY - centerY) / 50
    
    const distance = Math.sqrt(x * x + y * y)
    if (distance > 1) {
      x /= distance
      y /= distance
    }
    
    setPosition({ x: x * 50, y: y * 50 })
    onMove(x, -y) // Invert Y for forward/back
  }

  return (
    <div
      ref={baseRef}
      className="joystick-base"
      onTouchStart={(e) => {
        const touch = e.touches[0]
        handleStart(touch.clientX, touch.clientY)
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0]
        handleMove(touch.clientX, touch.clientY)
      }}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => dragging && handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <div
        className="joystick-stick"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`
        }}
      />
      <style jsx>{`
        .joystick-base {
          position: absolute;
          bottom: 30px;
          left: 30px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          border: 3px solid rgba(0, 255, 136, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          touch-action: none;
        }

        .joystick-stick {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(0, 255, 136, 0.9);
          box-shadow: 0 4px 12px rgba(0, 255, 136, 0.5);
          transition: transform 0.1s;
        }
      `}</style>
    </div>
  )
}
