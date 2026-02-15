'use client'

import { useState } from 'react'

interface Zone {
  id: string
  name: string
  type: string
  centerX: number
  centerY: number
  radius: number
  color: string
  description?: string
}

interface WorldData {
  name: string
  theme: string
  size: number
  zones: Zone[]
  lore: string
}

interface SimpleWorldViewProps {
  data: WorldData
}

// Simple CSS-based world view (no WebGL)
export default function SimpleWorldView({ data }: SimpleWorldViewProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Defensive checks
  if (!data) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        color: '#ff4444',
      }}>
        ⚠️ No world data provided
      </div>
    )
  }

  if (!data.zones || !Array.isArray(data.zones)) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        color: '#ffaa00',
        fontFamily: 'monospace',
        padding: 20,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
        <div>World: {data.name || 'Unknown'}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          No zones defined yet
        </div>
      </div>
    )
  }

  if (data.zones.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        color: '#ffaa00',
        fontFamily: 'monospace',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
        <div>{data.name}&apos;s World</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          World is empty - no zones created
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(180deg, #0a0a12 0%, #1a0a2e 100%)',
      padding: 20,
      overflow: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ 
          color: '#00ff88', 
          fontSize: 32, 
          margin: 0,
          textShadow: '0 0 20px rgba(0,255,136,0.5)'
        }}>
          🌍 {data.name}&apos;s World
        </h1>
        <p style={{ color: '#666', marginTop: 8 }}>
          Theme: {data.theme} | {data.zones.length} zones
        </p>
      </div>

      {/* Lore */}
      {data.lore && (
        <div style={{
          maxWidth: 600,
          margin: '0 auto 30px',
          padding: 16,
          background: 'rgba(0,255,136,0.1)',
          borderRadius: 8,
          borderLeft: '3px solid #00ff88',
        }}>
          <p style={{ 
            color: '#aaa', 
            margin: 0, 
            fontStyle: 'italic',
            fontSize: 14,
          }}>
            &quot;{data.lore}&quot;
          </p>
        </div>
      )}

      {/* Zones Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {data.zones.map((zone, index) => {
          // Skip malformed zones
          if (!zone || !zone.id) {
            console.warn('Skipping malformed zone at index', index)
            return null
          }
          const zoneColor = zone.color || '#00ff88'
          return (
          <div
            key={zone.id || `zone-${index}`}
            onClick={() => setSelectedZone(zone)}
            style={{
              background: `linear-gradient(135deg, ${zoneColor}22 0%, ${zoneColor}44 100%)`,
              border: `2px solid ${zoneColor}`,
              borderRadius: 12,
              padding: 20,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: selectedZone?.id === zone.id ? 'scale(1.02)' : 'scale(1)',
              boxShadow: selectedZone?.id === zone.id 
                ? `0 0 30px ${zoneColor}66` 
                : 'none',
            }}
          >
            <div style={{ 
              fontSize: 40, 
              marginBottom: 10,
              textAlign: 'center',
            }}>
              {zone.type === 'person' ? '💖' :
               zone.type === 'hobby' ? '⭐' :
               zone.type === 'interest' ? '💎' :
               zone.type === 'achievement' ? '🏆' :
               zone.type === 'place' ? '🌍' :
               zone.type === 'pet' ? '🐾' : '🔮'}
            </div>
            
            <h3 style={{ 
              color: zoneColor, 
              margin: '0 0 8px 0',
              fontSize: 18,
              textAlign: 'center',
            }}>
              {zone.name || 'Unknown Zone'}
            </h3>
            
            {zone.description && (
              <p style={{ 
                color: '#888', 
                margin: 0,
                fontSize: 13,
                textAlign: 'center',
              }}>
                {zone.description}
              </p>
            )}
            
            <div style={{
              marginTop: 12,
              padding: '6px 12px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 20,
              textAlign: 'center',
              fontSize: 11,
              color: '#666',
              textTransform: 'uppercase',
            }}>
              {zone.type || 'zone'}
            </div>
          </div>
        )})}  {/* Close return + map */}
      </div>

      {/* Selected Zone Detail */}
      {selectedZone && (() => {
        const selColor = selectedZone.color || '#00ff88'
        return (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.95)',
          border: `2px solid ${selColor}`,
          borderRadius: 12,
          padding: 20,
          maxWidth: 400,
          textAlign: 'center',
        }}>
          <h3 style={{ color: selColor, margin: '0 0 8px 0' }}>
            🎮 {selectedZone.name || 'Zone'}
          </h3>
          <p style={{ color: '#888', margin: 0, fontSize: 14 }}>
            {selectedZone.description || 'Explora esta zona del mundo'}
          </p>
          <button
            onClick={() => setSelectedZone(null)}
            style={{
              marginTop: 12,
              padding: '8px 20px',
              background: selColor,
              color: '#000',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Cerrar
          </button>
        </div>
      )})()}
    </div>
  )
}
