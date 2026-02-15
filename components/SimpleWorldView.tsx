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

  if (!data || !data.zones) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        color: '#ff4444',
      }}>
        ⚠️ No world data
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
        {data.zones.map((zone) => (
          <div
            key={zone.id}
            onClick={() => setSelectedZone(zone)}
            style={{
              background: `linear-gradient(135deg, ${zone.color}22 0%, ${zone.color}44 100%)`,
              border: `2px solid ${zone.color}`,
              borderRadius: 12,
              padding: 20,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: selectedZone?.id === zone.id ? 'scale(1.02)' : 'scale(1)',
              boxShadow: selectedZone?.id === zone.id 
                ? `0 0 30px ${zone.color}66` 
                : 'none',
            }}
          >
            <div style={{ 
              fontSize: 40, 
              marginBottom: 10,
              textAlign: 'center',
            }}>
              {zone.type === 'person' && '💖'}
              {zone.type === 'hobby' && '⭐'}
              {zone.type === 'interest' && '💎'}
              {zone.type === 'achievement' && '🏆'}
              {zone.type === 'place' && '🌍'}
              {zone.type === 'pet' && '🐾'}
            </div>
            
            <h3 style={{ 
              color: zone.color, 
              margin: '0 0 8px 0',
              fontSize: 18,
              textAlign: 'center',
            }}>
              {zone.name}
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
              {zone.type}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Zone Detail */}
      {selectedZone && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.95)',
          border: `2px solid ${selectedZone.color}`,
          borderRadius: 12,
          padding: 20,
          maxWidth: 400,
          textAlign: 'center',
        }}>
          <h3 style={{ color: selectedZone.color, margin: '0 0 8px 0' }}>
            🎮 {selectedZone.name}
          </h3>
          <p style={{ color: '#888', margin: 0, fontSize: 14 }}>
            {selectedZone.description || 'Explora esta zona del mundo'}
          </p>
          <button
            onClick={() => setSelectedZone(null)}
            style={{
              marginTop: 12,
              padding: '8px 20px',
              background: selectedZone.color,
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
      )}
    </div>
  )
}
