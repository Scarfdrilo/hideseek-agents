'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useState, useRef } from 'react'
import Maze3D from './Maze3D'

// Import the maze generator
const generateMaze = () => {
  // For now, use a hardcoded simple maze
  // In production, this would call the world-generator API
  const size = 21
  const maze = []
  
  for (let y = 0; y < size; y++) {
    maze[y] = []
    for (let x = 0; x < size; x++) {
      // Simple pattern: walls on edges, floor inside
      if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
        maze[y][x] = 'WALL'
      } else if ((x + y) % 3 === 0) {
        maze[y][x] = 'WALL'
      } else if (x === 10 && y === 10) {
        maze[y][x] = 'START'
      } else if ((x === 5 && y === 5) || (x === 15 && y === 15)) {
        maze[y][x] = 'HIDING_SPOT'
      } else {
        maze[y][x] = 'FLOOR'
      }
    }
  }
  
  return { maze, width: size, height: size, hidingSpots: [{x: 5, y: 5}, {x: 15, y: 15}] }
}

export default function MazeViewer() {
  const [mazeData, setMazeData] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    // Generate maze on mount
    const data = generateMaze()
    setMazeData(data)
    
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Virtual button handlers for mobile camera controls
  const handleRotateLeft = () => {
    if (controlsRef.current) {
      controlsRef.current.azimuthAngle -= 0.1
    }
  }
  
  const handleRotateRight = () => {
    if (controlsRef.current) {
      controlsRef.current.azimuthAngle += 0.1
    }
  }
  
  const handleZoomIn = () => {
    if (controlsRef.current) {
      const distance = controlsRef.current.getDistance()
      controlsRef.current.dollyIn(0.95)
      controlsRef.current.update()
    }
  }
  
  const handleZoomOut = () => {
    if (controlsRef.current) {
      const distance = controlsRef.current.getDistance()
      controlsRef.current.dollyOut(0.95)
      controlsRef.current.update()
    }
  }

  if (!mazeData) {
    return <div>Generating maze...</div>
  }

  return (
    <div className="viewer-container">
      <Canvas>
        <PerspectiveCamera makeDefault position={[15, 20, 15]} fov={60} />
        <OrbitControls 
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={10}
          maxDistance={50}
        />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, 10, -5]} intensity={0.5} />
        
        <Maze3D data={mazeData} />
        
        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </Canvas>

      {/* Toggle button for menu */}
      <button 
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Info panel - collapsible */}
      {menuOpen && (
        <div className="ui-overlay">
          <div className="stats">
            <h3>🎮 HideSeek Agents</h3>
            <p>Size: {mazeData.width}x{mazeData.height}</p>
            <p>Hiding Spots: {mazeData.hidingSpots.length}</p>
          </div>
          <div className="controls">
            <p><strong>Controls:</strong></p>
            {isMobile ? (
              <>
                <p>📱 1 dedo: Rotar</p>
                <p>📱 2 dedos: Pan</p>
                <p>📱 Pinch: Zoom</p>
                <p>O usa los botones →</p>
              </>
            ) : (
              <>
                <p>🖱️ Click + drag: Rotar</p>
                <p>🖱️ Right-click: Pan</p>
                <p>🖱️ Scroll: Zoom</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Virtual controls for mobile */}
      {isMobile && (
        <div className="virtual-controls">
          <div className="control-group">
            <button className="control-btn" onTouchStart={handleRotateLeft}>◀</button>
            <button className="control-btn" onTouchStart={handleRotateRight}>▶</button>
          </div>
          <div className="control-group">
            <button className="control-btn zoom" onTouchStart={handleZoomIn}>+</button>
            <button className="control-btn zoom" onTouchStart={handleZoomOut}>−</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .viewer-container {
          width: 100vw;
          height: 100vh;
          position: relative;
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
          transition: all 0.2s;
        }

        .menu-toggle:active {
          transform: scale(0.95);
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
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
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

        .virtual-controls {
          position: absolute;
          bottom: 30px;
          right: 20px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .control-group {
          display: flex;
          gap: 10px;
        }

        .control-btn {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          border: 2px solid #00ff88;
          background: rgba(0, 0, 0, 0.8);
          color: #00ff88;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          transition: all 0.1s;
          user-select: none;
        }

        .control-btn:active {
          transform: scale(0.95);
          background: rgba(0, 255, 136, 0.2);
        }

        .control-btn.zoom {
          font-size: 32px;
        }

        @media (max-width: 768px) {
          .menu-toggle {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }

          .ui-overlay {
            max-width: calc(100vw - 30px);
          }

          .virtual-controls {
            bottom: 20px;
            right: 15px;
          }

          .control-btn {
            width: 55px;
            height: 55px;
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  )
}
