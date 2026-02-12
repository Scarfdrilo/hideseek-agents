'use client'

import { useMemo, useRef } from 'react'
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

// Biome/zone definitions - different vibes for different areas
const BIOMES = {
  neon_core: { wall: '#001122', glow: '#00ffcc', floor: '#0a0a0a' },
  crystal: { wall: '#110022', glow: '#cc88ff', floor: '#080810' },
  toxic: { wall: '#0a1100', glow: '#88ff00', floor: '#050800' },
  ember: { wall: '#110800', glow: '#ff6600', floor: '#0a0500' },
}

// Determine biome based on position (creates organic zones)
function getBiome(x: number, z: number, width: number, height: number) {
  const cx = width / 2
  const cz = height / 2
  const dx = x - cx
  const dz = z - cz
  const angle = Math.atan2(dz, dx)
  const dist = Math.sqrt(dx * dx + dz * dz)
  
  // Inner core is neon
  if (dist < 5) return BIOMES.neon_core
  
  // Quadrant-based zones with some noise
  const noise = Math.sin(x * 0.5) * Math.cos(z * 0.5)
  if (angle > 0 && angle < Math.PI / 2) return noise > 0.3 ? BIOMES.crystal : BIOMES.neon_core
  if (angle > Math.PI / 2) return noise > 0.3 ? BIOMES.toxic : BIOMES.crystal
  if (angle < -Math.PI / 2) return noise > 0.3 ? BIOMES.ember : BIOMES.toxic
  return noise > 0.3 ? BIOMES.neon_core : BIOMES.ember
}

// Simple pulsing hiding spot
function HidingSpot({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.15
      ref.current.scale.setScalar(pulse)
    }
    if (glowRef.current) {
      glowRef.current.intensity = 0.5 + Math.sin(clock.elapsedTime * 3) * 0.2
    }
  })

  return (
    <group position={position}>
      {/* Core gem */}
      <mesh ref={ref} position={[0, 0.6, 0]}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial 
          color="#00ff88" 
          emissive="#00ff88"
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Glow - single light per spot */}
      <pointLight ref={glowRef} position={[0, 0.6, 0]} color="#00ff88" intensity={0.5} distance={3} />
    </group>
  )
}

// Cute decorations - low poly, no animation
function Decoration({ position, type, color }: { position: [number, number, number], type: 'mushroom' | 'crystal' | 'flower', color: string }) {
  if (type === 'mushroom') {
    return (
      <group position={position}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.25, 6]} />
          <meshStandardMaterial color="#886666" />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      </group>
    )
  }
  
  if (type === 'crystal') {
    return (
      <mesh position={[position[0], position[1] + 0.2, position[2]]} rotation={[0, Math.random() * Math.PI, 0]}>
        <coneGeometry args={[0.08, 0.4, 4]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
    )
  }
  
  // flower
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.01, 0.015, 0.2, 4]} />
        <meshStandardMaterial color="#446644" />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.06, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function Maze3D({ data }: MazeProps) {
  const { maze, width, height, hidingSpots } = data

  const elements = useMemo(() => {
    const walls: JSX.Element[] = []
    const floors: JSX.Element[] = []
    const spots: JSX.Element[] = []
    const decorations: JSX.Element[] = []
    
    // Track special areas
    const deadEnds: [number, number][] = []
    const intersections: [number, number][] = []

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = maze[y][x]
        const posX = x - width / 2
        const posZ = y - height / 2
        const biome = getBiome(x, y, width, height)

        if (tile === 'WALL') {
          // Varied wall heights for interest
          const wallHeight = 2 + Math.sin(x * 0.7 + y * 0.5) * 0.5
          
          walls.push(
            <mesh key={`wall-${x}-${y}`} position={[posX, wallHeight / 2, posZ]} castShadow>
              <boxGeometry args={[1, wallHeight, 1]} />
              <meshStandardMaterial 
                color={biome.wall}
                emissive={biome.glow}
                emissiveIntensity={0.08}
              />
            </mesh>
          )
          
          // Edge glow lines (top of walls) - sparse
          if ((x + y) % 4 === 0) {
            walls.push(
              <mesh key={`edge-${x}-${y}`} position={[posX, wallHeight, posZ]}>
                <boxGeometry args={[0.95, 0.05, 0.95]} />
                <meshStandardMaterial 
                  color={biome.glow}
                  emissive={biome.glow}
                  emissiveIntensity={0.5}
                />
              </mesh>
            )
          }
        } else {
          // Floor
          floors.push(
            <mesh key={`floor-${x}-${y}`} position={[posX, 0, posZ]} receiveShadow>
              <boxGeometry args={[1, 0.1, 1]} />
              <meshStandardMaterial color={biome.floor} />
            </mesh>
          )
          
          // Count adjacent floor tiles to detect dead ends & intersections
          let adjacentFloors = 0
          const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]
          dirs.forEach(([dx, dy]) => {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && maze[ny][nx] !== 'WALL') {
              adjacentFloors++
            }
          })
          
          if (adjacentFloors === 1 && tile === 'FLOOR') {
            deadEnds.push([x, y])
          } else if (adjacentFloors >= 3 && tile === 'FLOOR') {
            intersections.push([x, y])
          }
          
          // Add decorations at interesting spots
          if (tile === 'FLOOR') {
            const decorChance = Math.random()
            const biomeColors = [biome.glow, '#ff88cc', '#88ffcc', '#ffcc88']
            const color = biomeColors[Math.floor(Math.random() * biomeColors.length)]
            
            // Dead ends get special decoration
            if (adjacentFloors === 1 && decorChance > 0.3) {
              decorations.push(
                <Decoration 
                  key={`dec-${x}-${y}`}
                  position={[posX + (Math.random() - 0.5) * 0.4, 0.05, posZ + (Math.random() - 0.5) * 0.4]}
                  type="crystal"
                  color={color}
                />
              )
            }
            // Intersections sometimes get mushrooms
            else if (adjacentFloors >= 3 && decorChance > 0.7) {
              decorations.push(
                <Decoration 
                  key={`dec-${x}-${y}`}
                  position={[posX + (Math.random() - 0.5) * 0.3, 0.05, posZ + (Math.random() - 0.5) * 0.3]}
                  type="mushroom"
                  color={color}
                />
              )
            }
            // Scattered flowers
            else if (decorChance > 0.92) {
              decorations.push(
                <Decoration 
                  key={`dec-${x}-${y}`}
                  position={[posX + (Math.random() - 0.5) * 0.5, 0.05, posZ + (Math.random() - 0.5) * 0.5]}
                  type="flower"
                  color={color}
                />
              )
            }
          }
          
          // Hiding spots
          if (tile === 'HIDING_SPOT') {
            spots.push(
              <HidingSpot key={`spot-${x}-${y}`} position={[posX, 0, posZ]} />
            )
          }
          
          // Start position marker
          if (tile === 'START') {
            floors.push(
              <mesh key={`start-glow-${x}-${y}`} position={[posX, 0.06, posZ]}>
                <ringGeometry args={[0.3, 0.4, 16]} />
                <meshStandardMaterial 
                  color="#00aaff" 
                  emissive="#00aaff"
                  emissiveIntensity={0.8}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )
          }
        }
      }
    }

    return { walls, floors, spots, decorations }
  }, [maze, width, height])

  return (
    <group>
      {elements.walls}
      {elements.floors}
      {elements.spots}
      {elements.decorations}
    </group>
  )
}
