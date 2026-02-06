'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    // Generate maze on mount
    const data = generateMaze()
    setMazeData(data)
  }, [])

  if (!mazeData) {
    return <div>Generating maze...</div>
  }

  return (
    <div className="viewer-container">
      <Canvas>
        <PerspectiveCamera makeDefault position={[15, 20, 15]} fov={60} />
        <OrbitControls 
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

      <div className="ui-overlay">
        <div className="stats">
          <h3>🎮 HideSeek Agents Demo</h3>
          <p>Size: {mazeData.width}x{mazeData.height}</p>
          <p>Hiding Spots: {mazeData.hidingSpots.length}</p>
        </div>
        <div className="controls">
          <p><strong>Controls:</strong></p>
          <p>🖱️ Left-click + drag: Rotate</p>
          <p>🖱️ Right-click + drag: Pan</p>
          <p>🖱️ Scroll: Zoom</p>
        </div>
      </div>

      <style jsx>{`
        .viewer-container {
          width: 100vw;
          height: 100vh;
          position: relative;
        }

        .ui-overlay {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 100;
          background: rgba(0, 0, 0, 0.8);
          padding: 1.5rem;
          border-radius: 10px;
          border: 2px solid #00ff88;
          max-width: 300px;
        }

        .stats h3 {
          margin-bottom: 0.5rem;
          color: #00ff88;
        }

        .stats p {
          margin: 0.25rem 0;
          color: #ccc;
        }

        .controls {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #333;
          color: #888;
          font-size: 0.9rem;
        }

        .controls p {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  )
}
