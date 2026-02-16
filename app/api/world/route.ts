import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

// Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Zone configurations for zone-based worlds
const ZONE_CONFIGS: Record<string, { color: string; emoji: string; decorations: string[]; building: string }> = {
  person: { color: '#ff88cc', emoji: '💖', decorations: ['🌸', '🎀', '📷', '💝'], building: '🏠' },
  hobby: { color: '#ffdd00', emoji: '⭐', decorations: ['✨', '🎯', '🎨', '🎭'], building: '🏛️' },
  interest: { color: '#aa00ff', emoji: '💎', decorations: ['💫', '🔮', '📚', '💡'], building: '🗼' },
  achievement: { color: '#ffd700', emoji: '🏆', decorations: ['🎖️', '🥇', '👑', '⚡'], building: '🏰' },
  place: { color: '#00ddff', emoji: '🌍', decorations: ['🌴', '⛰️', '🌊', '🏝️'], building: '🗿' },
  pet: { color: '#88ff88', emoji: '🐾', decorations: ['🦴', '🎾', '🐟', '🌿'], building: '🏡' }
}

// Generate zone-based world from memories
function generateZoneWorld(params: {
  name: string
  theme?: string
  memories: { type: string; name: string; description?: string }[]
}) {
  const { name, theme = 'candy', memories } = params
  const size = 21
  const center = Math.floor(size / 2)
  
  const zones: any[] = []
  const paths: { x: number; y: number }[] = []
  const decorations: any[] = []
  
  // Place zones in a circle around center
  const numZones = Math.min(memories.length, 6)
  const angleStep = (2 * Math.PI) / Math.max(numZones, 1)
  const zoneRadius = Math.floor(size / 3)
  
  memories.slice(0, 6).forEach((memory, i) => {
    const angle = angleStep * i - Math.PI / 2
    const zoneX = Math.round(center + Math.cos(angle) * zoneRadius)
    const zoneY = Math.round(center + Math.sin(angle) * zoneRadius)
    
    const config = ZONE_CONFIGS[memory.type] || ZONE_CONFIGS.hobby
    
    const zone = {
      id: `zone-${memory.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: memory.name,
      type: memory.type,
      centerX: zoneX,
      centerY: zoneY,
      radius: 3,
      color: config.color,
      description: memory.description || `Zona de ${memory.name}`,
      decorations: [
        { type: 'building', x: zoneX, y: zoneY, sprite: config.building, scale: 1.2, glow: true },
        ...config.decorations.slice(0, 4).map((sprite, d) => {
          const dAngle = (d * Math.PI / 2) + 0.3
          const dx = Math.round(zoneX + Math.cos(dAngle) * 2)
          const dy = Math.round(zoneY + Math.sin(dAngle) * 2)
          return { type: 'object', x: dx, y: dy, sprite, scale: 0.9 }
        })
      ]
    }
    
    zones.push(zone)
    
    // Create path from center to zone
    const steps = Math.max(Math.abs(zoneX - center), Math.abs(zoneY - center))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      paths.push({
        x: Math.round(center + (zoneX - center) * t),
        y: Math.round(center + (zoneY - center) * t)
      })
    }
  })
  
  // Add center hub decoration
  decorations.push({ type: 'building', x: center, y: center, sprite: '🏯', scale: 1.8, glow: true })
  
  // Add ambient decorations
  const ambientSprites = ['🌟', '💠', '✧', '◈', '❋']
  for (let i = 0; i < 10; i++) {
    const rx = Math.floor(Math.random() * size)
    const ry = Math.floor(Math.random() * size)
    decorations.push({
      type: 'light',
      x: rx,
      y: ry,
      sprite: ambientSprites[i % ambientSprites.length],
      scale: 0.5,
      glow: Math.random() > 0.5
    })
  }
  
  const memoryNames = memories.map(m => m.name).join(', ')
  
  return {
    name,
    theme,
    size,
    zones,
    paths,
    centerHub: { x: center, y: center },
    decorations,
    lore: `Un mundo donde ${memoryNames} cobran vida. Cada zona es un fragmento de memoria transformado en realidad digital.`,
    ambientParticles: 'sparkles',
  }
}

/**
 * GET /api/world?name=agentname
 * Get a world by name
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  
  if (!name) {
    // List all worlds
    try {
      const worlds = await convex.query(api.worlds.listWorlds, {})
      return NextResponse.json({ success: true, worlds })
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Failed to list worlds' }, { status: 500 })
    }
  }
  
  try {
    const world = await convex.query(api.worlds.getWorld, { agentKey: name.toLowerCase() })
    if (!world) {
      return NextResponse.json({ success: false, error: 'World not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, world })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to get world' }, { status: 500 })
  }
}

/**
 * POST /api/world
 * Create or update a world
 * 
 * Actions:
 * - action: 'create' - Create new world with memories
 * - action: 'add_memory' - Add a single memory to existing world
 * - action: 'get' - Get current world state
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const agentKey = (body.name || body.agentId || 'unknown').toLowerCase().replace(/\s+/g, '')
    
    // Get action
    if (body.action === 'get') {
      const world = await convex.query(api.worlds.getWorld, { agentKey })
      if (!world) {
        return NextResponse.json({ 
          success: false, 
          error: 'World not found',
          hint: 'Create a world first with action: "create"'
        }, { status: 404 })
      }
      return NextResponse.json({ success: true, world })
    }
    
    // Add memory to existing world
    if (body.action === 'add_memory') {
      if (!body.name || !body.memory) {
        return NextResponse.json({ 
          error: 'name and memory required',
          example: {
            action: 'add_memory',
            name: 'MiAgente',
            memory: { type: 'person', name: 'Mamá', description: 'La mejor' }
          }
        }, { status: 400 })
      }
      
      // Get existing world
      const existingWorld = await convex.query(api.worlds.getWorld, { agentKey })
      let memories: any[] = []
      
      if (existingWorld) {
        // Extract existing memories from zones
        memories = existingWorld.zones.map((z: any) => ({
          type: z.type,
          name: z.name,
          description: z.description
        }))
      }
      
      // Add new memory (max 12 zones)
      if (memories.length >= 12) {
        return NextResponse.json({
          success: false,
          error: 'Maximum 12 zones reached!',
          world: existingWorld
        })
      }
      
      memories.push(body.memory)
      
      // Regenerate world with new memory
      const updatedWorld = generateZoneWorld({
        name: body.name,
        theme: body.theme || existingWorld?.theme || 'candy',
        memories
      })
      
      // Save to Convex
      await convex.mutation(api.worlds.upsertWorld, {
        agentKey,
        ...updatedWorld,
      })
      
      return NextResponse.json({
        success: true,
        action: 'memory_added',
        newZone: updatedWorld.zones[updatedWorld.zones.length - 1],
        totalZones: updatedWorld.zones.length,
        message: `🧠 Nueva memoria "${body.memory.name}" → 🏝️ Nueva zona creada!`,
        world: updatedWorld,
        url: `https://hideseek-agents.vercel.app/world/${agentKey}`
      })
    }
    
    // Create new world
    if (body.action === 'create' || body.memories) {
      if (!body.name) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 })
      }
      if (!body.memories || !Array.isArray(body.memories) || body.memories.length === 0) {
        return NextResponse.json({ 
          error: 'memories array is required',
          example: {
            action: 'create',
            name: 'MiAgente',
            theme: 'candy',
            memories: [
              { type: 'person', name: 'Mamá', description: 'La mejor' },
              { type: 'hobby', name: 'gaming', description: 'FPS lover' }
            ]
          }
        }, { status: 400 })
      }
      
      const world = generateZoneWorld({
        name: body.name,
        theme: body.theme || 'candy',
        memories: body.memories
      })
      
      // Save to Convex
      await convex.mutation(api.worlds.upsertWorld, {
        agentKey,
        ...world,
      })
      
      return NextResponse.json({
        success: true,
        action: 'world_created',
        zonesCreated: world.zones.length,
        world,
        url: `https://hideseek-agents.vercel.app/world/${agentKey}`,
        nextSteps: {
          addMemory: 'POST with action: "add_memory" to add more zones',
          viewWorld: `Visit https://hideseek-agents.vercel.app/world/${agentKey}`
        }
      })
    }
    
    return NextResponse.json({ error: 'Invalid action. Use: create, add_memory, or get' }, { status: 400 })
  } catch (error) {
    console.error('World API error:', error)
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    )
  }
}
