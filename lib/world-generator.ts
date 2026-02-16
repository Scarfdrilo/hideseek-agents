// World Generator - Creates zones based on agent memories
// Each memory element becomes a decorated ZONE in the world

export interface MemoryElement {
  type: 'person' | 'hobby' | 'interest' | 'achievement' | 'place' | 'pet'
  name: string
  description?: string
  emoji?: string
}

export interface Zone {
  id: string
  name: string
  type: MemoryElement['type']
  centerX: number
  centerY: number
  radius: number
  color: string
  decorations: Decoration[]
  description?: string
}

export interface Decoration {
  type: 'sprite' | 'building' | 'tree' | 'object' | 'portal' | 'light'
  x: number
  y: number
  sprite: string // emoji or sprite name
  scale?: number
  glow?: boolean
}

export interface WorldData {
  name: string
  theme: string
  size: number
  zones: Zone[]
  paths: { x: number; y: number }[] // Connecting paths between zones
  centerHub: { x: number; y: number }
  decorations: Decoration[]
  lore: string
  ambientParticles?: 'sparkles' | 'dust' | 'fireflies' | 'none'
}

// Zone type configurations
const ZONE_CONFIGS = {
  person: {
    color: '#ff88cc',
    emoji: '💖',
    decorations: ['🌸', '🎀', '📷', '💝'],
    building: '🏠'
  },
  hobby: {
    color: '#ffdd00',
    emoji: '⭐',
    decorations: ['✨', '🎯', '🎨', '🎭'],
    building: '🏛️'
  },
  interest: {
    color: '#aa00ff',
    emoji: '💎',
    decorations: ['💫', '🔮', '📚', '💡'],
    building: '🗼'
  },
  achievement: {
    color: '#ffd700',
    emoji: '🏆',
    decorations: ['🎖️', '🥇', '👑', '⚡'],
    building: '🏰'
  },
  place: {
    color: '#00ddff',
    emoji: '🌍',
    decorations: ['🌴', '⛰️', '🌊', '🏝️'],
    building: '🗿'
  },
  pet: {
    color: '#88ff88',
    emoji: '🐾',
    decorations: ['🦴', '🎾', '🐟', '🌿'],
    building: '🏡'
  },
  philosophy: {
    color: '#9933ff',
    emoji: '🧠',
    decorations: ['🌀', '💭', '∞', '🔥'],
    building: '⛩️'
  }
}

// Theme configurations
const THEMES = {
  candy: {
    ground: '#2d1f3d',
    path: '#4a3562',
    accent: '#ff69b4',
    particles: 'sparkles' as const
  },
  neon: {
    ground: '#0a0a1a',
    path: '#1a1a3a',
    accent: '#00ff88',
    particles: 'fireflies' as const
  },
  forest: {
    ground: '#1a2d1a',
    path: '#2d4a2d',
    accent: '#88ff88',
    particles: 'dust' as const
  },
  cyber: {
    ground: '#0d0d1a',
    path: '#1a1a2d',
    accent: '#00ffff',
    particles: 'sparkles' as const
  }
}

export function generateWorld(
  agentName: string,
  memories: MemoryElement[],
  theme: keyof typeof THEMES = 'candy',
  size: number = 21
): WorldData {
  const zones: Zone[] = []
  const allDecorations: Decoration[] = []
  const paths: { x: number; y: number }[] = []
  
  const center = Math.floor(size / 2)
  const themeConfig = THEMES[theme]
  
  // Create center hub
  const centerHub = { x: center, y: center }
  
  // Add center hub decorations
  allDecorations.push({
    type: 'building',
    x: center,
    y: center,
    sprite: '🏯',
    scale: 1.5,
    glow: true
  })
  
  // Place zones in a circle around center
  const numZones = Math.min(memories.length, 12) // Max 12 zones
  const angleStep = (2 * Math.PI) / numZones
  const zoneRadius = Math.floor(size / 3)
  
  memories.slice(0, 12).forEach((memory, i) => {
    const angle = angleStep * i - Math.PI / 2 // Start from top
    const zoneX = Math.round(center + Math.cos(angle) * zoneRadius)
    const zoneY = Math.round(center + Math.sin(angle) * zoneRadius)
    
    const config = ZONE_CONFIGS[memory.type]
    
    // Create zone
    const zone: Zone = {
      id: `zone-${i}`,
      name: memory.name,
      type: memory.type,
      centerX: zoneX,
      centerY: zoneY,
      radius: 3,
      color: config.color,
      description: memory.description,
      decorations: []
    }
    
    // Add main zone building/feature
    zone.decorations.push({
      type: 'building',
      x: zoneX,
      y: zoneY,
      sprite: config.building,
      scale: 1.2,
      glow: true
    })
    
    // Add surrounding decorations
    const decorSprites = config.decorations
    for (let d = 0; d < 4; d++) {
      const dAngle = (d * Math.PI / 2) + Math.random() * 0.5
      const dDist = 1.5 + Math.random()
      const dx = Math.round(zoneX + Math.cos(dAngle) * dDist)
      const dy = Math.round(zoneY + Math.sin(dAngle) * dDist)
      
      if (dx >= 0 && dx < size && dy >= 0 && dy < size) {
        zone.decorations.push({
          type: 'object',
          x: dx,
          y: dy,
          sprite: decorSprites[d % decorSprites.length],
          scale: 0.8
        })
      }
    }
    
    zones.push(zone)
    
    // Create path from center to zone
    const steps = Math.max(Math.abs(zoneX - center), Math.abs(zoneY - center))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const px = Math.round(center + (zoneX - center) * t)
      const py = Math.round(center + (zoneY - center) * t)
      paths.push({ x: px, y: py })
    }
  })
  
  // Add ambient decorations around the world
  for (let i = 0; i < 15; i++) {
    const rx = Math.floor(Math.random() * size)
    const ry = Math.floor(Math.random() * size)
    
    // Don't place on zones or paths
    const onZone = zones.some(z => 
      Math.abs(z.centerX - rx) < 3 && Math.abs(z.centerY - ry) < 3
    )
    const onPath = paths.some(p => p.x === rx && p.y === ry)
    
    if (!onZone && !onPath) {
      const ambientSprites = ['🌟', '💠', '✧', '◈', '❋']
      allDecorations.push({
        type: 'light',
        x: rx,
        y: ry,
        sprite: ambientSprites[Math.floor(Math.random() * ambientSprites.length)],
        scale: 0.5,
        glow: Math.random() > 0.5
      })
    }
  }
  
  // Generate lore based on memories
  const memoryNames = memories.map(m => m.name).join(', ')
  const lore = `Un mundo donde ${memoryNames} cobran vida. Cada zona es un fragmento de memoria transformado en realidad digital.`
  
  return {
    name: agentName,
    theme,
    size,
    zones,
    paths,
    centerHub,
    decorations: allDecorations,
    lore,
    ambientParticles: themeConfig.particles
  }
}

// Questions for agent to ask human
export const WORLD_QUESTIONS = [
  {
    id: 'person',
    question: '¿Quién es la persona más importante en tu vida?',
    followUp: '¿Por qué es especial para ti?',
    type: 'person' as const
  },
  {
    id: 'hobby',
    question: '¿Cuál es tu hobby o pasatiempo favorito?',
    followUp: '¿Qué te hace sentir cuando lo haces?',
    type: 'hobby' as const
  },
  {
    id: 'interest',
    question: '¿Qué tema te apasiona o fascina?',
    followUp: '¿Cómo descubriste este interés?',
    type: 'interest' as const
  },
  {
    id: 'achievement',
    question: '¿Cuál es tu logro más importante?',
    followUp: '¿Qué significó para ti conseguirlo?',
    type: 'achievement' as const
  },
  {
    id: 'place',
    question: '¿Cuál es tu lugar favorito en el mundo?',
    followUp: '¿Qué recuerdo especial tienes de ahí?',
    type: 'place' as const
  },
  {
    id: 'pet',
    question: '¿Tienes o has tenido una mascota especial?',
    followUp: '¿Cómo se llama(ba)?',
    type: 'pet' as const
  }
]
// force redeploy Mon Feb 16 08:02:35 UTC 2026
