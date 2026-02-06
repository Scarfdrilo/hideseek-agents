'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const MazeViewer = dynamic(() => import('@/components/MazeViewer'), {
  ssr: false,
  loading: () => <div className="loading">Loading 3D viewer...</div>
})

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <main className="main">
      {!isPlaying ? (
        <div className="landing">
          <h1>🎮 HideSeek Agents</h1>
          <p>Adversarial AI Gaming on Monad</p>
          <button 
            className="btn-play"
            onClick={() => setIsPlaying(true)}
          >
            Play Demo
          </button>
          <div className="info">
            <p>AI Agents vs Humans • Procedural Worlds • Winner Takes All</p>
          </div>
        </div>
      ) : (
        <MazeViewer />
      )}
      
      <style jsx>{`
        .main {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
        }

        .landing {
          text-align: center;
          padding: 2rem;
        }

        h1 {
          font-size: 4rem;
          margin-bottom: 1rem;
          background: linear-gradient(45deg, #00ff88, #00aaff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        p {
          font-size: 1.5rem;
          color: #888;
          margin-bottom: 2rem;
        }

        .btn-play {
          padding: 1rem 3rem;
          font-size: 1.5rem;
          background: linear-gradient(45deg, #00ff88, #00aaff);
          border: none;
          border-radius: 50px;
          color: #000;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-play:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
        }

        .info {
          margin-top: 2rem;
          color: #666;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          font-size: 1.5rem;
          color: #888;
        }
      `}</style>
    </main>
  )
}
