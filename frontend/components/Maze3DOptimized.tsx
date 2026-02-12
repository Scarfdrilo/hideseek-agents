'use client'

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MazeProps {
  data: {
    maze: string[][]
    width: number
    height: number
    hidingSpots: { x: number; y: number }[]
  }
}

// Biomes for visual variety
const BIOMES = {
  neon_core: { wall: new THREE.Color('#001122'), glow: new THREE.Color('#00ffcc'), floor: '#0a0a0a' },
  crystal: { wall: new THREE.Color('#110022'), glow: new THREE.Color('#cc88ff'), floor: '#080810' },
  toxic: { wall: new THREE.Color('#0a1100'), glow: new THREE.Color('#88ff00'), floor: '#050800' },
  ember: { wall: new THREE.Color('#110800'), glow: new THREE.Color('#ff6600'), floor: '#0a0500' },
}

function getBiome(x: number, z: number, width: number, height: number) {
  const cx = width / 2
  const cz = height / 2
  const dx = x - cx
  const dz = z - cz
  const angle = Math.atan2(dz, dx)
  const dist = Math.sqrt(dx * dx + dz * dz)
  
  if (dist < 5) return BIOMES.neon_core
  const noise = Math.sin(x * 0.5) * Math.cos(z * 0.5)
  if (angle > 0 && angle < Math.PI / 2) return noise > 0.3 ? BIOMES.crystal : BIOMES.neon_core
  if (angle > Math.PI / 2) return noise > 0.3 ? BIOMES.toxic : BIOMES.crystal
  if (angle < -Math.PI / 2) return noise > 0.3 ? BIOMES.ember : BIOMES.toxic
  return noise > 0.3 ? BIOMES.neon_core : BIOMES.ember
}

// Instanced walls - HUGE performance boost
function InstancedWalls({ walls }: { walls: { x: number; z: number; height: number; color: THREE.Color }[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  
  useEffect(() => {
    if (!meshRef.current) return
    
    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()
    
    walls.forEach((wall, i) => {
      matrix.makeTranslation(wall.x, wall.height / 2, wall.z)
      matrix.scale(new THREE.Vector3(1, wall.height, 1))
      meshRef.current!.setMatrixAt(i, matrix)
      meshRef.current!.setColorAt(i, wall.color)
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [walls])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, walls.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        vertexColors
        emissive="#003344"
        emissiveIntensity={0.05}
      />
    </instancedMesh>
  )
}

// Merged floor - single draw call
function MergedFloor({ tiles }: { tiles: { x: number; z: number }[] }) {
  const geometry = useMemo(() => {
    const positions: number[] = []
    const indices: number[] = []
    
    tiles.forEach((tile, i) => {
      const x = tile.x
      const z = tile.z
      const y = 0
      const baseIndex = i * 4
      
      // 4 vertices per tile
      positions.push(
        x - 0.5, y, z - 0.5,
        x + 0.5, y, z - 0.5,
        x + 0.5, y, z + 0.5,
        x - 0.5, y, z + 0.5
      )
      
      // 2 triangles per tile
      indices.push(
        baseIndex, baseIndex + 1, baseIndex + 2,
        baseIndex, baseIndex + 2, baseIndex + 3
      )
    })
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    
    return geo
  }, [tiles])

  return (
    <mesh geometry={geometry} position={[0, -0.05, 0]}>
      <meshStandardMaterial color="#0a0a0a" />
    </mesh>
  )
}

// Pulsing hiding spot
function HidingSpot({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.15
      ref.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={position}>
      <mesh ref={ref} position={[0, 0.6, 0]}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial 
          color="#00ff88" 
          emissive="#00ff88"
          emissiveIntensity={0.6}
        />
      </mesh>
      <pointLight position={[0, 0.6, 0]} color="#00ff88" intensity={0.5} distance={3} />
    </group>
  )
}

// Simple decorations - batched
function InstancedDecorations({ decorations }: { decorations: { x: number; z: number; type: 'crystal' | 'mushroom' }[] }) {
  const crystalRef = useRef<THREE.InstancedMesh>(null)
  const crystals = decorations.filter(d => d.type === 'crystal')
  
  useEffect(() => {
    if (!crystalRef.current || crystals.length === 0) return
    
    const matrix = new THREE.Matrix4()
    crystals.forEach((dec, i) => {
      matrix.makeTranslation(dec.x, 0.2, dec.z)
      matrix.multiply(new THREE.Matrix4().makeRotationY(Math.random() * Math.PI))
      crystalRef.current!.setMatrixAt(i, matrix)
    })
    crystalRef.current.instanceMatrix.needsUpdate = true
  }, [crystals])

  if (crystals.length === 0) return null

  return (
    <instancedMesh ref={crystalRef} args={[undefined, undefined, crystals.length]}>
      <coneGeometry args={[0.08, 0.4, 4]} />
      <meshStandardMaterial 
        color="#88ffcc"
        emissive="#88ffcc"
        emissiveIntensity={0.3}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  )
}

export default function Maze3DOptimized({ data }: MazeProps) {
  const { maze, width, height } = data

  const processedData = useMemo(() => {
    const walls: { x: number; z: number; height: number; color: THREE.Color }[] = []
    const floors: { x: number; z: number }[] = []
    const hidingSpots: [number, number, number][] = []
    const decorations: { x: number; z: number; type: 'crystal' | 'mushroom' }[] = []
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = maze[y][x]
        const posX = x - width / 2
        const posZ = y - height / 2
        const biome = getBiome(x, y, width, height)

        if (tile === 'WALL') {
          const wallHeight = 2 + Math.sin(x * 0.7 + y * 0.5) * 0.5
          walls.push({ x: posX, z: posZ, height: wallHeight, color: biome.wall })
        } else {
          floors.push({ x: posX, z: posZ })
          
          if (tile === 'HIDING_SPOT') {
            hidingSpots.push([posX, 0, posZ])
          }
          
          // Sparse decorations
          if (tile === 'FLOOR' && Math.random() > 0.9) {
            decorations.push({ x: posX, z: posZ, type: 'crystal' })
          }
        }
      }
    }

    return { walls, floors, hidingSpots, decorations }
  }, [maze, width, height])

  return (
    <group>
      {/* Instanced walls - 1 draw call for ALL walls */}
      <InstancedWalls walls={processedData.walls} />
      
      {/* Merged floor - 1 draw call */}
      <MergedFloor tiles={processedData.floors} />
      
      {/* Instanced decorations - 1 draw call per type */}
      <InstancedDecorations decorations={processedData.decorations} />
      
      {/* Hiding spots - few enough to render individually */}
      {processedData.hidingSpots.map((pos, i) => (
        <HidingSpot key={i} position={pos} />
      ))}
      
      {/* Start marker */}
      <mesh position={[0, 0.06, 0]}>
        <ringGeometry args={[0.3, 0.4, 16]} />
        <meshStandardMaterial 
          color="#00aaff" 
          emissive="#00aaff"
          emissiveIntensity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/**
 * PERFORMANCE COMPARISON:
 * 
 * Original (Maze3D.tsx):
 * - ~300 wall meshes = 300 draw calls
 * - ~300 floor meshes = 300 draw calls  
 * - ~50 decorations = 50 draw calls
 * - Total: ~650 draw calls
 * 
 * Optimized (Maze3DOptimized.tsx):
 * - 1 instanced wall mesh = 1 draw call
 * - 1 merged floor mesh = 1 draw call
 * - 1 instanced decoration mesh = 1 draw call
 * - ~6 hiding spots = 6 draw calls
 * - Total: ~9 draw calls
 * 
 * Improvement: 70x fewer draw calls! 🚀
 */
