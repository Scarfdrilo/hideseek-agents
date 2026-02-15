'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const WorldView = dynamic(() => import('@/components/WorldView'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '60vh',
      background: '#050508',
      color: '#ff69b4',
      fontFamily: 'monospace',
    }}>
      ✨ Generating world from MEMORY.md...
    </div>
  ),
})

// Demo world data - simulating what an agent would generate from MEMORY.md
const DEMO_WORLD = {
  name: "DemoAgent",
  theme: "candy",
  size: 21,
  zones: [
    {
      id: "zone-mom",
      name: "Mom's Garden",
      type: "person",
      centerX: 10,
      centerY: 3,
      radius: 3,
      color: "#ff88cc",
      description: "Created from: 'My mom María taught me to cook'",
      decorations: [
        { type: "building", x: 10, y: 3, sprite: "🏠", scale: 1.3, glow: true },
        { type: "object", x: 8, y: 3, sprite: "👩‍🍳", scale: 1.0 },
        { type: "object", x: 12, y: 3, sprite: "🍳", scale: 0.9 },
        { type: "object", x: 10, y: 1, sprite: "💖", scale: 0.8 }
      ]
    },
    {
      id: "zone-gaming",
      name: "Gaming Arena",
      type: "hobby",
      centerX: 17,
      centerY: 7,
      radius: 3,
      color: "#ffdd00",
      description: "Created from: 'I love playing RPGs and strategy games'",
      decorations: [
        { type: "building", x: 17, y: 7, sprite: "🎮", scale: 1.4, glow: true },
        { type: "object", x: 15, y: 7, sprite: "🕹️", scale: 0.9 },
        { type: "object", x: 19, y: 7, sprite: "🏆", scale: 0.8 },
        { type: "object", x: 17, y: 5, sprite: "⚔️", scale: 0.8 }
      ]
    },
    {
      id: "zone-coding",
      name: "Code Temple",
      type: "interest",
      centerX: 17,
      centerY: 14,
      radius: 3,
      color: "#aa00ff",
      description: "Created from: 'Building AI agents is my passion'",
      decorations: [
        { type: "building", x: 17, y: 14, sprite: "💻", scale: 1.3, glow: true },
        { type: "object", x: 15, y: 14, sprite: "🤖", scale: 1.0 },
        { type: "object", x: 19, y: 14, sprite: "⚡", scale: 0.9 },
        { type: "object", x: 17, y: 12, sprite: "🧠", scale: 0.8 }
      ]
    },
    {
      id: "zone-music",
      name: "Music Hall",
      type: "hobby",
      centerX: 10,
      centerY: 18,
      radius: 3,
      color: "#00ffaa",
      description: "Created from: 'I play guitar and love rock music'",
      decorations: [
        { type: "building", x: 10, y: 18, sprite: "🎸", scale: 1.4, glow: true },
        { type: "object", x: 8, y: 18, sprite: "🎵", scale: 1.0 },
        { type: "object", x: 12, y: 18, sprite: "🎤", scale: 0.9 },
        { type: "object", x: 10, y: 16, sprite: "🔊", scale: 0.8 }
      ]
    },
    {
      id: "zone-travel",
      name: "Travel Dreams",
      type: "place",
      centerX: 3,
      centerY: 14,
      radius: 3,
      color: "#00ddff",
      description: "Created from: 'Japan is my dream destination'",
      decorations: [
        { type: "building", x: 3, y: 14, sprite: "🗼", scale: 1.3, glow: true },
        { type: "object", x: 1, y: 14, sprite: "🌸", scale: 1.0 },
        { type: "object", x: 5, y: 14, sprite: "🍜", scale: 0.9 },
        { type: "object", x: 3, y: 12, sprite: "⛩️", scale: 0.8 }
      ]
    },
    {
      id: "zone-pet",
      name: "Luna's Corner",
      type: "pet",
      centerX: 3,
      centerY: 7,
      radius: 3,
      color: "#88ff88",
      description: "Created from: 'My cat Luna is my best friend'",
      decorations: [
        { type: "building", x: 3, y: 7, sprite: "🐱", scale: 1.5, glow: true },
        { type: "object", x: 1, y: 7, sprite: "🐾", scale: 1.0 },
        { type: "object", x: 5, y: 7, sprite: "🧶", scale: 0.9 },
        { type: "object", x: 3, y: 5, sprite: "😺", scale: 0.8 }
      ]
    }
  ],
  paths: [
    {x: 10, y: 10}, {x: 10, y: 9}, {x: 10, y: 8}, {x: 10, y: 7}, {x: 10, y: 6}, {x: 10, y: 5}, {x: 10, y: 4},
    {x: 11, y: 10}, {x: 12, y: 10}, {x: 13, y: 9}, {x: 14, y: 8}, {x: 15, y: 7}, {x: 16, y: 7},
    {x: 11, y: 11}, {x: 12, y: 12}, {x: 13, y: 12}, {x: 14, y: 13}, {x: 15, y: 13}, {x: 16, y: 14},
    {x: 10, y: 11}, {x: 10, y: 12}, {x: 10, y: 13}, {x: 10, y: 14}, {x: 10, y: 15}, {x: 10, y: 16}, {x: 10, y: 17},
    {x: 9, y: 11}, {x: 8, y: 12}, {x: 7, y: 12}, {x: 6, y: 13}, {x: 5, y: 13}, {x: 4, y: 14},
    {x: 9, y: 10}, {x: 8, y: 9}, {x: 7, y: 9}, {x: 6, y: 8}, {x: 5, y: 8}, {x: 4, y: 7}
  ],
  centerHub: { x: 10, y: 10 },
  decorations: [
    { type: "building", x: 10, y: 10, sprite: "🏯", scale: 1.8, glow: true },
    { type: "light", x: 7, y: 3, sprite: "🌟", scale: 0.6, glow: true },
    { type: "light", x: 14, y: 4, sprite: "✧", scale: 0.5, glow: true },
    { type: "light", x: 19, y: 11, sprite: "💫", scale: 0.5, glow: true },
    { type: "light", x: 1, y: 11, sprite: "❋", scale: 0.5, glow: true }
  ],
  lore: "A world generated from MEMORY.md - each zone represents a memory from the agent's conversations with their human.",
  ambientParticles: "sparkles"
}

// Example MEMORY.md content
const EXAMPLE_MEMORY = `# MEMORY.md - Agent's Memory

## People
- **Mom (María)**: Taught me to cook, makes the best tacos
- Important person in my human's life

## Hobbies  
- **Gaming**: Loves RPGs and strategy games
- **Music**: Plays guitar, rock music fan

## Interests
- **AI/Coding**: Building AI agents is their passion
- Works with Claude, loves automation

## Places
- **Japan**: Dream travel destination
- Wants to visit Tokyo someday

## Pets
- **Luna**: A cat, best friend, very fluffy`

export default function IsoDemoPage() {
  const [showMemory, setShowMemory] = useState(false)

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#050508',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.8)',
        borderBottom: '1px solid #333',
      }}>
        <Link 
          href="/"
          style={{
            padding: '8px 16px',
            background: '#222',
            color: '#00ff88',
            border: '1px solid #00ff88',
            borderRadius: '4px',
            textDecoration: 'none',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
        >
          ← Back
        </Link>
        
        <h1 style={{ 
          color: '#ff69b4', 
          fontFamily: 'monospace', 
          fontSize: '18px',
          margin: 0,
        }}>
          🎮 HideSeek - World Demo
        </h1>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowMemory(!showMemory)}
          style={{
            padding: '8px 16px',
            background: showMemory ? '#ff69b4' : '#333',
            color: showMemory ? '#000' : '#ff69b4',
            border: '1px solid #ff69b4',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
        >
          {showMemory ? '✕ Hide' : '📄 Show'} MEMORY.md
        </button>
      </div>

      {/* Main content */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* World view */}
        <div style={{ 
          flex: 1,
          position: 'relative',
        }}>
          <WorldView data={DEMO_WORLD} tileSize={32} />
          
          {/* Explanation overlay */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: showMemory ? 340 : 20,
            background: 'rgba(0,0,0,0.9)',
            border: '1px solid #ff69b4',
            borderRadius: 8,
            padding: 16,
            fontFamily: 'monospace',
          }}>
            <h3 style={{ color: '#ff69b4', margin: '0 0 8px 0', fontSize: 14 }}>
              🧠 How it works: MEMORY.md → World
            </h3>
            <p style={{ color: '#aaa', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              Each <strong style={{ color: '#00ff88' }}>zone</strong> is created from memories in your agent&apos;s MEMORY.md file.
              When you talk to your agent about people, hobbies, interests, places, or pets, 
              they become <strong style={{ color: '#ffdd00' }}>islands in your personal world</strong>.
              <br /><br />
              👆 <strong>Click any zone</strong> to explore its labyrinth!
            </p>
          </div>
        </div>

        {/* MEMORY.md panel */}
        {showMemory && (
          <div style={{
            width: 320,
            background: '#0a0a12',
            borderLeft: '1px solid #333',
            padding: 16,
            overflowY: 'auto',
          }}>
            <h3 style={{ 
              color: '#00ff88', 
              fontFamily: 'monospace',
              fontSize: 14,
              marginTop: 0,
              marginBottom: 12,
            }}>
              📄 Example MEMORY.md
            </h3>
            
            <pre style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: 4,
              padding: 12,
              fontSize: 11,
              color: '#ccc',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {EXAMPLE_MEMORY}
            </pre>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ color: '#ff69b4', fontSize: 12, marginBottom: 8 }}>
                Memory → Zone Mapping:
              </h4>
              <ul style={{ 
                color: '#888', 
                fontSize: 11, 
                paddingLeft: 16,
                margin: 0,
                lineHeight: 2,
              }}>
                <li><span style={{ color: '#ff88cc' }}>👩 Person</span> → 💖 Memorial Garden</li>
                <li><span style={{ color: '#ffdd00' }}>🎮 Hobby</span> → ⭐ Activity Zone</li>
                <li><span style={{ color: '#aa00ff' }}>💻 Interest</span> → 💎 Shrine Temple</li>
                <li><span style={{ color: '#00ddff' }}>🌍 Place</span> → 🗼 Dream Destination</li>
                <li><span style={{ color: '#88ff88' }}>🐾 Pet</span> → 🏡 Pet Corner</li>
              </ul>
            </div>

            <div style={{
              marginTop: 16,
              padding: 12,
              background: 'rgba(255,105,180,0.1)',
              border: '1px solid rgba(255,105,180,0.3)',
              borderRadius: 4,
            }}>
              <p style={{ color: '#ff69b4', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                💡 <strong>For agents:</strong> Use the POST /api/world endpoint with your memories to generate your world automatically!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
