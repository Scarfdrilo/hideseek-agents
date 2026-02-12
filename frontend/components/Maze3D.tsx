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

// Glowing neon plant/mushroom
function NeonPlant({ position, color, scale = 1 }: { position: [number, number, number], color: string, scale?: number }) {
  const ref = useRef<THREE.Group>(null)
  const baseIntensity = 0.8 + Math.random() * 0.4
  
  useFrame(({ clock }) => {
    if (ref.current) {
      // Gentle sway
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.5 + position[0]) * 0.1
      ref.current.rotation.x = Math.cos(clock.elapsedTime * 0.3 + position[2]) * 0.05
    }
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.04, 0.4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Glowing cap/bulb */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={baseIntensity}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Point light for glow effect */}
      <pointLight position={[0, 0.45, 0]} color={color} intensity={0.3} distance={2} />
    </group>
  )
}

// Floating glowing spore particle
function Spore({ startPosition }: { startPosition: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  const speed = 0.2 + Math.random() * 0.3
  const offset = Math.random() * Math.PI * 2
  const color = ['#00ffcc', '#ff00ff', '#00ff88', '#ffff00'][Math.floor(Math.random() * 4)]
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = startPosition[1] + Math.sin(clock.elapsedTime * speed + offset) * 0.5
      ref.current.position.x = startPosition[0] + Math.sin(clock.elapsedTime * speed * 0.5 + offset) * 0.3
      ref.current.position.z = startPosition[2] + Math.cos(clock.elapsedTime * speed * 0.7 + offset) * 0.3
    }
  })

  return (
    <mesh ref={ref} position={startPosition}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={2}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

// Bioluminescent wall segment
function NeonWall({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  // Random color per wall for variety
  const colorIndex = Math.floor((position[0] + position[2]) * 100) % 5
  const colors = ['#001a33', '#0d001a', '#001a1a', '#1a0d00', '#0d0d1a']
  const glowColors = ['#00ccff', '#cc00ff', '#00ffcc', '#ff6600', '#6666ff']
  const baseColor = colors[colorIndex]
  const glowColor = glowColors[colorIndex]
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const material = ref.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 0.5 + position[0]) * 0.1
    }
  })

  return (
    <mesh ref={ref} position={position} castShadow>
      <boxGeometry args={[1, 2.5, 1]} />
      <meshStandardMaterial 
        color={baseColor}
        emissive={glowColor}
        emissiveIntensity={0.2}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  )
}

// Glowing floor tile
function NeonFloor({ position, isStart }: { position: [number, number, number], isStart?: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const hasVein = Math.random() > 0.7
  const veinColor = ['#00ff88', '#00ccff', '#ff00cc'][Math.floor(Math.random() * 3)]
  
  useFrame(({ clock }) => {
    if (ref.current && hasVein) {
      const material = ref.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.1 + Math.sin(clock.elapsedTime + position[0] * position[2]) * 0.05
    }
  })

  return (
    <mesh ref={ref} position={position} receiveShadow>
      <boxGeometry args={[1, 0.1, 1]} />
      <meshStandardMaterial 
        color={isStart ? '#003366' : '#0a0a0a'}
        emissive={isStart ? '#00aaff' : (hasVein ? veinColor : '#000000')}
        emissiveIntensity={isStart ? 0.5 : (hasVein ? 0.1 : 0)}
        roughness={0.9}
      />
    </mesh>
  )
}

// Hiding spot with pulsing glow
function HidingSpot({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.1
      ref.current.scale.set(scale, scale, scale)
      const material = ref.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.8 + Math.sin(clock.elapsedTime * 2) * 0.4
    }
    if (lightRef.current) {
      lightRef.current.intensity = 0.8 + Math.sin(clock.elapsedTime * 2) * 0.3
    }
  })

  return (
    <group position={position}>
      {/* Main orb */}
      <mesh ref={ref} position={[0, 0.5, 0]}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial 
          color="#00ff88" 
          emissive="#00ff88"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
          wireframe={false}
        />
      </mesh>
      {/* Inner core */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff"
          emissiveIntensity={1}
        />
      </mesh>
      {/* Glow light */}
      <pointLight ref={lightRef} position={[0, 0.5, 0]} color="#00ff88" intensity={0.8} distance={4} />
      {/* Particle ring */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <FloatingParticle key={i} center={[0, 0.5, 0]} index={i} />
      ))}
    </group>
  )
}

function FloatingParticle({ center, index }: { center: [number, number, number], index: number }) {
  const ref = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const angle = clock.elapsedTime + (index * Math.PI / 3)
      ref.current.position.x = center[0] + Math.cos(angle) * 0.5
      ref.current.position.z = center[2] + Math.sin(angle) * 0.5
      ref.current.position.y = center[1] + Math.sin(clock.elapsedTime * 2 + index) * 0.2
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshStandardMaterial 
        color="#88ffcc"
        emissive="#88ffcc"
        emissiveIntensity={1}
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}

export default function Maze3D({ data }: MazeProps) {
  const { maze, width, height } = data

  const elements = useMemo(() => {
    const walls: JSX.Element[] = []
    const floors: JSX.Element[] = []
    const spots: JSX.Element[] = []
    const plants: JSX.Element[] = []
    const spores: JSX.Element[] = []

    const plantColors = ['#00ff88', '#00ccff', '#ff00ff', '#ffcc00', '#ff6666']

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = maze[y][x]
        const posX = x - width / 2
        const posZ = y - height / 2

        if (tile === 'WALL') {
          walls.push(
            <NeonWall key={`wall-${x}-${y}`} position={[posX, 1.25, posZ]} />
          )
          
          // Add plants on top of some walls
          if (Math.random() > 0.7) {
            const plantColor = plantColors[Math.floor(Math.random() * plantColors.length)]
            plants.push(
              <NeonPlant 
                key={`plant-${x}-${y}`} 
                position={[posX + (Math.random() - 0.5) * 0.5, 2.5, posZ + (Math.random() - 0.5) * 0.5]} 
                color={plantColor}
                scale={0.8 + Math.random() * 0.6}
              />
            )
          }
        } else if (tile === 'FLOOR' || tile === 'START') {
          floors.push(
            <NeonFloor 
              key={`floor-${x}-${y}`} 
              position={[posX, 0, posZ]} 
              isStart={tile === 'START'} 
            />
          )
          
          // Scatter some floor plants
          if (Math.random() > 0.9 && tile === 'FLOOR') {
            const plantColor = plantColors[Math.floor(Math.random() * plantColors.length)]
            plants.push(
              <NeonPlant 
                key={`fplant-${x}-${y}`} 
                position={[posX + (Math.random() - 0.5) * 0.6, 0.05, posZ + (Math.random() - 0.5) * 0.6]} 
                color={plantColor}
                scale={0.5 + Math.random() * 0.3}
              />
            )
          }
          
          // Add floating spores in open areas
          if (Math.random() > 0.85) {
            spores.push(
              <Spore 
                key={`spore-${x}-${y}`} 
                startPosition={[posX, 1 + Math.random() * 2, posZ]} 
              />
            )
          }
        } else if (tile === 'HIDING_SPOT') {
          floors.push(
            <NeonFloor key={`floor-${x}-${y}`} position={[posX, 0, posZ]} />
          )
          spots.push(
            <HidingSpot key={`spot-${x}-${y}`} position={[posX, 0, posZ]} />
          )
        }
      }
    }

    return { walls, floors, spots, plants, spores }
  }, [maze, width, height])

  return (
    <group>
      {elements.walls}
      {elements.floors}
      {elements.spots}
      {elements.plants}
      {elements.spores}
    </group>
  )
}
