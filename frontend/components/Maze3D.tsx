'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

interface MazeProps {
  data: {
    maze: string[][]
    width: number
    height: number
    hidingSpots: { x: number; y: number }[]
  }
}

export default function Maze3D({ data }: MazeProps) {
  const { maze, width, height } = data

  const meshes = useMemo(() => {
    const walls: JSX.Element[] = []
    const floors: JSX.Element[] = []
    const spots: JSX.Element[] = []

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = maze[y][x]
        const posX = x - width / 2
        const posZ = y - height / 2

        if (tile === 'WALL') {
          walls.push(
            <mesh key={`wall-${x}-${y}`} position={[posX, 1, posZ]} castShadow>
              <boxGeometry args={[1, 2, 1]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          )
        } else if (tile === 'FLOOR' || tile === 'START') {
          floors.push(
            <mesh key={`floor-${x}-${y}`} position={[posX, 0, posZ]} receiveShadow>
              <boxGeometry args={[1, 0.1, 1]} />
              <meshStandardMaterial color={tile === 'START' ? '#00aaff' : '#222'} />
            </mesh>
          )
        } else if (tile === 'HIDING_SPOT') {
          floors.push(
            <mesh key={`floor-${x}-${y}`} position={[posX, 0, posZ]} receiveShadow>
              <boxGeometry args={[1, 0.1, 1]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          )
          spots.push(
            <mesh key={`spot-${x}-${y}`} position={[posX, 0.5, posZ]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial 
                color="#00ff88" 
                emissive="#00ff88"
                emissiveIntensity={0.5}
              />
            </mesh>
          )
        }
      }
    }

    return { walls, floors, spots }
  }, [maze, width, height])

  return (
    <group>
      {meshes.walls}
      {meshes.floors}
      {meshes.spots}
    </group>
  )
}
