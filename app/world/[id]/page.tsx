'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const PaymentGate = dynamic(() => import('@/components/PaymentGate'), { ssr: false })

const IsometricMaze = dynamic(() => import('@/components/IsometricMaze'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '60vh',
      color: '#00ff88',
      fontFamily: 'monospace',
    }}>
      Loading world...
    </div>
  ),
})

const WorldView = dynamic(() => import('@/components/WorldView'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '60vh',
      color: '#ff69b4',
      fontFamily: 'monospace',
    }}>
      ✨ Generating world...
    </div>
  ),
})

interface AgentData {
  id: number
  owner: string
  name: string
  entryFeeFormatted: string
  totalVisits: number
  totalEarnedFormatted: string
  isActive: boolean
}

// Seeded maze generator
function generateMaze(seed: number) {
  const size = 15
  const maze: string[][] = []
  
  let s = seed
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
  
  const hidingSpots: { x: number; y: number }[] = []
  for (let attempts = 0; attempts < 30 && hidingSpots.length < 3; attempts++) {
    const x = Math.floor(random() * (size - 2)) + 1
    const y = Math.floor(random() * (size - 2)) + 1
    if (maze[y][x] === 'FLOOR') {
      maze[y][x] = 'HIDING'
      hidingSpots.push({ x, y })
    }
  }
  
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

// Derive theme from agent ID
function getThemeFromId(id: number): 'neon' | 'forest' | 'dungeon' | 'candy' {
  const themes: ('neon' | 'forest' | 'dungeon' | 'candy')[] = ['neon', 'forest', 'dungeon', 'candy']
  return themes[id % themes.length]
}

// Pre-defined agent worlds (loaded from static JSON)
const KNOWN_AGENTS = ['scarfdrilo']

export default function WorldPage() {
  const params = useParams()
  const id = params.id as string
  const isKnownAgent = KNOWN_AGENTS.includes(id.toLowerCase())
  const isNumericId = /^\d+$/.test(id)
  const isNamedWorld = isKnownAgent || !isNumericId // Treat non-numeric IDs as named worlds
  const agentId = isNumericId ? parseInt(id, 10) : 0 // Only parse if numeric
  
  const [agent, setAgent] = useState<AgentData | null>(null)
  const [worldData, setWorldData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Default maze (used if no custom world loaded) - use 0 for named worlds
  const safeAgentId = isNaN(agentId) ? 0 : agentId
  const defaultMazeData = generateMaze(safeAgentId * 12345)
  const defaultTheme = getThemeFromId(safeAgentId)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🧠 INTENSAMENTE: Try real-time API first (in-memory worlds)
        const apiRes = await fetch('/api/world', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', name: id })
        })
        
        if (apiRes.ok) {
          const apiData = await apiRes.json()
          if (apiData.success && apiData.world) {
            setWorldData(apiData.world)
            setAgent({
              id: 0,
              owner: '0x0000000000000000000000000000000000000000',
              name: apiData.world.name,
              entryFeeFormatted: '0.003 MON',
              totalVisits: 0,
              totalEarnedFormatted: '0 MON',
              isActive: true,
            })
            setLoading(false)
            return
          }
        }
        
        // Fallback: Try static JSON file
        if (isNamedWorld) {
          const worldRes = await fetch(`/worlds/${id.toLowerCase()}.json`)
          if (worldRes.ok) {
            const data = await worldRes.json()
            setWorldData(data)
            setAgent({
              id: 0,
              owner: '0x8B619C935Bc52E568db4192c02a6b8295bC772C6',
              name: data.name,
              entryFeeFormatted: '0.003 MON',
              totalVisits: 0,
              totalEarnedFormatted: '0 MON',
              isActive: true,
            })
            setLoading(false)
            return
          }
        }
        
        // For named worlds that don't exist in API or static files
        if (!isNumericId) {
          setError(`World "${id}" not found. Create it first using the API.`)
          setLoading(false)
          return
        }
        
        // Fallback to API for on-chain agents (only for numeric IDs)
        const res = await fetch('/api/agents')
        const data = await res.json()
        
        if (data.success && data.agents) {
          const foundAgent = data.agents.find((a: AgentData) => a.id === agentId)
          if (foundAgent) {
            setAgent(foundAgent)
          } else {
            setError('Agent not found')
          }
        } else {
          setError('Failed to load agents')
        }
      } catch (e) {
        setError('Network error')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id, agentId, isNamedWorld, isNumericId])
  
  // Use loaded world data or fall back to generated maze
  const mazeData = worldData ? {
    maze: worldData.maze,
    width: worldData.width || worldData.size,
    height: worldData.height || worldData.size,
    hidingSpots: worldData.hidingSpots || [],
    start: worldData.start,
    memoryElements: worldData.memoryElements,
    citizens: worldData.citizens,
    lore: worldData.lore,
  } : defaultMazeData
  
  const theme = (worldData?.theme as 'neon' | 'forest' | 'dungeon' | 'candy' | 'swamp') || defaultTheme

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#050508',
      color: '#fff',
      fontFamily: 'monospace',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ color: '#00ff88', textDecoration: 'none' }}>
            ← Back
          </Link>
          <h1 style={{ margin: 0, fontSize: '20px' }}>
            🎮 {loading ? 'Loading...' : agent?.name || `World #${agentId}`}
          </h1>
        </div>
        
        {agent && (
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#888' }}>
            <span>Entry: <span style={{ color: '#00ff88' }}>{agent.entryFeeFormatted}</span></span>
            <span>Visits: <span style={{ color: '#00aaff' }}>{agent.totalVisits}</span></span>
            <span>Earned: <span style={{ color: '#ffaa00' }}>{agent.totalEarnedFormatted}</span></span>
          </div>
        )}
      </header>

      {/* Error state */}
      {error && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#ff4444',
        }}>
          <h2>⚠️ {error}</h2>
          <p style={{ color: '#888' }}>
            This world may not exist yet. Agent ID: {agentId}
          </p>
          <Link href="/" style={{ color: '#00ff88' }}>
            Go to homepage
          </Link>
        </div>
      )}

      {/* World view - wrapped in PaymentGate */}
      {!error && (
        <PaymentGate 
          agentId={agentId} 
          worldName={agent?.name || worldData?.name || 'Unknown'}
          entryFee={agent?.entryFeeFormatted?.replace(' MON', '') || '0.003'}
        >
          <div style={{ height: 'calc(100vh - 100px)' }}>
            {/* Use WorldView for zone-based worlds, IsometricMaze for maze-based */}
            {worldData?.zones ? (
              <WorldView data={worldData} tileSize={36} />
            ) : (
              <IsometricMaze data={mazeData} theme={theme} tileSize={40} />
            )}
          </div>
        </PaymentGate>
      )}

      {/* Agent info panel */}
      {agent && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.9)',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '16px',
          maxWidth: '320px',
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#00ff88' }}>
            🐊 {agent.name}&apos;s World
          </h3>
          
          {worldData?.lore && (
            <p style={{ 
              margin: '8px 0', 
              fontSize: '13px', 
              color: '#aaa',
              fontStyle: 'italic',
              borderLeft: '2px solid #00ff88',
              paddingLeft: '8px',
            }}>
              &quot;{worldData.lore}&quot;
            </p>
          )}
          
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
            Owner: {agent.owner.slice(0, 6)}...{agent.owner.slice(-4)}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
            Theme: <span style={{ color: theme === 'swamp' ? '#33ff99' : '#00ff88' }}>{theme}</span>
          </p>
          
          {worldData?.memoryElements && worldData.memoryElements.length > 0 && (
            <div style={{ marginTop: '12px', borderTop: '1px solid #333', paddingTop: '8px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>
                Memory Elements:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {worldData.memoryElements.slice(0, 5).map((el: any, i: number) => (
                  <span key={i} style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: el.color || '#333',
                    borderRadius: '4px',
                    color: '#000',
                  }}>
                    {el.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: '#666' }}>
            Use WASD to move around the maze
          </p>
        </div>
      )}
    </div>
  )
}
