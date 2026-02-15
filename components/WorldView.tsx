'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Application, Graphics, Text, TextStyle, Container, Sprite, Texture } from 'pixi.js'
import dynamic from 'next/dynamic'

const ZoneLabyrinth = dynamic(() => import('./ZoneLabyrinth'), { ssr: false })

interface Zone {
  id: string
  name: string
  type: string
  centerX: number
  centerY: number
  radius: number
  color: string
  decorations: Decoration[]
  description?: string
}

interface Decoration {
  type: string
  x: number
  y: number
  sprite: string
  scale?: number
  glow?: boolean
}

interface WorldData {
  name: string
  theme: string
  size: number
  zones: Zone[]
  paths: { x: number; y: number }[]
  centerHub: { x: number; y: number }
  decorations: Decoration[]
  lore: string
  ambientParticles?: string
}

interface WorldViewProps {
  data: WorldData
  tileSize?: number
}

// Theme color palettes
const THEMES: Record<string, {
  ground: number
  path: number
  accent: number
  glow: number
  text: number
}> = {
  candy: {
    ground: 0x2d1f3d,
    path: 0x4a3562,
    accent: 0xff69b4,
    glow: 0xff88cc,
    text: 0xffffff
  },
  neon: {
    ground: 0x0a0a1a,
    path: 0x1a1a3a,
    accent: 0x00ff88,
    glow: 0x00ffaa,
    text: 0x00ff88
  },
  neon_jungle: {
    ground: 0x0a1a0a,
    path: 0x1a3a1a,
    accent: 0x00ff88,
    glow: 0x33ff99,
    text: 0x00ff88
  },
  forest: {
    ground: 0x1a2d1a,
    path: 0x2d4a2d,
    accent: 0x88ff88,
    glow: 0xaaffaa,
    text: 0xccffcc
  },
  swamp: {
    ground: 0x0d1a0d,
    path: 0x1a2d1a,
    accent: 0x33ff99,
    glow: 0x44ff88,
    text: 0x33ff99
  },
  cyber: {
    ground: 0x0d0d1a,
    path: 0x1a1a2d,
    accent: 0x00ffff,
    glow: 0x44ffff,
    text: 0x00ffff
  }
}

export default function WorldView({ data, tileSize = 32 }: WorldViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Safety checks
  if (!data || !data.zones || !data.paths) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        color: '#ff4444',
        fontFamily: 'monospace',
      }}>
        ⚠️ Error: World data is missing or invalid
      </div>
    )
  }
  
  const colors = THEMES[data.theme] || THEMES.candy
  const tileW = tileSize
  const tileH = tileSize / 2

  // Convert grid coords to isometric screen coords
  const toIso = useCallback((x: number, y: number) => {
    return {
      x: (x - y) * (tileW / 2),
      y: (x + y) * (tileH / 2)
    }
  }, [tileW, tileH])

  // Draw an isometric diamond tile
  const drawTile = useCallback((g: Graphics, screenX: number, screenY: number, color: number, alpha: number = 1) => {
    g.fill({ color, alpha })
    g.poly([
      screenX, screenY - tileH / 2,
      screenX + tileW / 2, screenY,
      screenX, screenY + tileH / 2,
      screenX - tileW / 2, screenY,
    ])
    g.fill()
  }, [tileW, tileH])

  useEffect(() => {
    if (!containerRef.current) return

    const initApp = async () => {
      try {
        // Clean up existing app
        if (appRef.current) {
          appRef.current.destroy(true)
          appRef.current = null
        }

        // Safety check for container
        if (!containerRef.current) {
          console.error('Container not ready')
          return
        }

        const app = new Application()
        await app.init({
          width: containerRef.current.clientWidth || 800,
          height: containerRef.current.clientHeight || 600,
          backgroundColor: colors.ground,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        })

        // Check if container still exists after async init
        if (!containerRef.current) {
          app.destroy(true)
          return
        }

        containerRef.current.appendChild(app.canvas)
        appRef.current = app

      // Main container for all world elements
      const worldContainer = new Container()
      app.stage.addChild(worldContainer)

      // Center the world
      const centerOffsetX = app.screen.width / 2
      const centerOffsetY = app.screen.height / 3
      worldContainer.position.set(centerOffsetX, centerOffsetY)

      const graphics = new Graphics()
      worldContainer.addChild(graphics)

      // Draw ground tiles
      for (let y = 0; y < data.size; y++) {
        for (let x = 0; x < data.size; x++) {
          const { x: screenX, y: screenY } = toIso(x, y)
          
          // Check if on path
          const onPath = data.paths.some(p => p.x === x && p.y === y)
          
          // Check if in zone
          const inZone = data.zones.find(z => {
            const dist = Math.sqrt(Math.pow(z.centerX - x, 2) + Math.pow(z.centerY - y, 2))
            return dist <= z.radius
          })
          
          let tileColor = colors.ground
          let alpha = 0.3
          
          if (inZone) {
            // Parse zone color
            const zoneColor = parseInt(inZone.color.replace('#', ''), 16)
            tileColor = zoneColor
            alpha = 0.4 + Math.random() * 0.2
          } else if (onPath) {
            tileColor = colors.path
            alpha = 0.6
          }
          
          drawTile(graphics, screenX, screenY, tileColor, alpha)
        }
      }

      // Draw zone labels and decorations (CLICKABLE!)
      for (const zone of data.zones) {
        const { x: zx, y: zy } = toIso(zone.centerX, zone.centerY)
        
        // Clickable zone container
        const zoneContainer = new Container()
        zoneContainer.eventMode = 'static'
        zoneContainer.cursor = 'pointer'
        zoneContainer.on('pointerdown', () => setSelectedZone(zone))
        zoneContainer.on('pointerover', () => setHoveredZone(zone))
        zoneContainer.on('pointerout', () => setHoveredZone(null))
        worldContainer.addChild(zoneContainer)
        
        const zoneGraphics = new Graphics()
        zoneContainer.addChild(zoneGraphics)
        
        // Zone glow effect (clickable area)
        zoneGraphics.fill({ color: parseInt(zone.color.replace('#', ''), 16), alpha: 0.3 })
        zoneGraphics.circle(zx, zy, tileSize * 2.5)
        zoneGraphics.fill()
        
        // Inner highlight
        zoneGraphics.fill({ color: parseInt(zone.color.replace('#', ''), 16), alpha: 0.2 })
        zoneGraphics.circle(zx, zy, tileSize * 1.5)
        zoneGraphics.fill()
        
        // Zone name label
        const labelStyle = new TextStyle({
          fontFamily: 'monospace',
          fontSize: 14,
          fill: 0xffffff,
          fontWeight: 'bold',
          dropShadow: {
            color: 0x000000,
            blur: 4,
            distance: 2,
          }
        })
        
        const label = new Text({ text: zone.name.toUpperCase(), style: labelStyle })
        label.anchor.set(0.5)
        label.position.set(zx, zy - tileSize * 1.5)
        zoneContainer.addChild(label)
        
        // "Click to enter" hint
        const hintStyle = new TextStyle({
          fontFamily: 'monospace',
          fontSize: 10,
          fill: parseInt(zone.color.replace('#', ''), 16),
        })
        const hint = new Text({ text: '▶ ENTRAR', style: hintStyle })
        hint.anchor.set(0.5)
        hint.position.set(zx, zy + tileSize * 1.8)
        zoneContainer.addChild(hint)
        
        // Zone decorations as emoji text
        for (const decor of zone.decorations) {
          const { x: dx, y: dy } = toIso(decor.x, decor.y)
          
          const emojiStyle = new TextStyle({
            fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
            fontSize: (decor.scale || 1) * 24,
          })
          
          const emoji = new Text({ text: decor.sprite, style: emojiStyle })
          emoji.anchor.set(0.5)
          emoji.position.set(dx, dy - tileSize / 2)
          worldContainer.addChild(emoji)
          
          // Add glow effect
          if (decor.glow) {
            graphics.fill({ color: colors.glow, alpha: 0.2 })
            graphics.circle(dx, dy, tileSize / 2)
            graphics.fill()
          }
        }
      }

      // Draw center hub
      const { x: hubX, y: hubY } = toIso(data.centerHub.x, data.centerHub.y)
      
      // Hub glow
      graphics.fill({ color: colors.glow, alpha: 0.3 })
      graphics.circle(hubX, hubY, tileSize * 2)
      graphics.fill()
      
      // Hub decorations
      for (const decor of data.decorations) {
        const { x: dx, y: dy } = toIso(decor.x, decor.y)
        
        const emojiStyle = new TextStyle({
          fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
          fontSize: (decor.scale || 1) * 24,
        })
        
        const emoji = new Text({ text: decor.sprite, style: emojiStyle })
        emoji.anchor.set(0.5)
        emoji.position.set(dx, dy - tileSize / 2)
        worldContainer.addChild(emoji)
        
        if (decor.glow) {
          graphics.fill({ color: colors.glow, alpha: 0.15 })
          graphics.circle(dx, dy, tileSize / 3)
          graphics.fill()
        }
      }

      // Add world name
      const titleStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 28,
        fill: colors.text,
        fontWeight: 'bold',
        letterSpacing: 4,
        dropShadow: {
          color: 0x000000,
          blur: 8,
          distance: 3,
        }
      })
      
      const title = new Text({ text: `🌍 ${data.name}'s World`, style: titleStyle })
      title.anchor.set(0.5, 0)
      title.position.set(app.screen.width / 2, 20)
      app.stage.addChild(title)

      // Add theme label
      const themeStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fill: colors.accent,
      })
      
      const themeLabel = new Text({ text: `Theme: ${data.theme} | ${data.zones.length} zones`, style: themeStyle })
      themeLabel.position.set(10, app.screen.height - 30)
      app.stage.addChild(themeLabel)

      // Simple ambient particle animation
      if (data.ambientParticles && data.ambientParticles !== 'none') {
        const particles: { x: number; y: number; vx: number; vy: number; life: number }[] = []
        
        app.ticker.add(() => {
          // Spawn new particles
          if (particles.length < 30 && Math.random() > 0.95) {
            particles.push({
              x: Math.random() * app.screen.width,
              y: Math.random() * app.screen.height,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -Math.random() * 0.5 - 0.2,
              life: 1
            })
          }
          
          // Update particles
          const particleGraphics = new Graphics()
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]
            p.x += p.vx
            p.y += p.vy
            p.life -= 0.005
            
            if (p.life <= 0) {
              particles.splice(i, 1)
            } else {
              particleGraphics.fill({ color: colors.glow, alpha: p.life * 0.5 })
              particleGraphics.circle(p.x, p.y, 2)
              particleGraphics.fill()
            }
          }
        })
      }
      } catch (err) {
        console.error('WorldView initialization error:', err)
        setError('Failed to initialize world view')
      }
    }

    initApp()

    return () => {
      if (appRef.current) {
        try {
          appRef.current.destroy(true)
        } catch (e) {
          console.error('Error destroying app:', e)
        }
        appRef.current = null
      }
    }
  }, [data, colors, toIso, drawTile, tileSize])

  // Show error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        color: '#ff4444',
        fontFamily: 'monospace',
        padding: 20,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div>{error}</div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: 20,
            padding: '10px 20px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Recargar página
        </button>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        background: `linear-gradient(180deg, #0a0a12 0%, #${colors.ground.toString(16).padStart(6, '0')} 100%)`
      }}
    >
      {/* Zone info tooltip */}
      {hoveredZone && !selectedZone && (
        <div style={{
          position: 'absolute',
          bottom: 60,
          left: 10,
          padding: '12px 16px',
          background: 'rgba(0,0,0,0.8)',
          borderRadius: 8,
          border: `1px solid ${hoveredZone.color}`,
          color: 'white',
          fontFamily: 'monospace',
          maxWidth: 300
        }}>
          <div style={{ fontWeight: 'bold', color: hoveredZone.color, marginBottom: 4 }}>
            🎮 {hoveredZone.name}
          </div>
          {hoveredZone.description && (
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
              {hoveredZone.description}
            </div>
          )}
          <div style={{ fontSize: 11, color: hoveredZone.color }}>
            ▶ Click para explorar el laberinto
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: 70,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: 20,
        color: '#888',
        fontFamily: 'monospace',
        fontSize: 12,
      }}>
        👆 Haz click en una zona para explorar su laberinto
      </div>

      {/* Zone Labyrinth Modal */}
      {selectedZone && (
        <ZoneLabyrinth 
          zone={selectedZone} 
          onClose={() => setSelectedZone(null)} 
        />
      )}
    </div>
  )
}
