'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'

interface PerformanceMonitorProps {
  /** Show FPS overlay (default: false in production) */
  enabled?: boolean
  /** Callback when FPS drops below threshold */
  onLowFPS?: (fps: number) => void
  /** FPS threshold for low performance warning (default: 24) */
  threshold?: number
}

/**
 * Performance monitoring component for Three.js scenes
 * 
 * Usage:
 * ```tsx
 * <Canvas>
 *   <PerformanceMonitor enabled={isDev} onLowFPS={(fps) => setLiteMode(true)} />
 *   <YourScene />
 * </Canvas>
 * ```
 */
export function PerformanceMonitor({ 
  enabled = false, 
  onLowFPS, 
  threshold = 24 
}: PerformanceMonitorProps) {
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const [fps, setFps] = useState(60)
  const lowFpsCount = useRef(0)

  useFrame(() => {
    frameCount.current++
    const now = performance.now()
    const delta = now - lastTime.current

    // Update FPS every 500ms
    if (delta >= 500) {
      const currentFps = Math.round((frameCount.current / delta) * 1000)
      setFps(currentFps)
      frameCount.current = 0
      lastTime.current = now

      // Track low FPS occurrences
      if (currentFps < threshold) {
        lowFpsCount.current++
        // Trigger callback after 3 consecutive low readings
        if (lowFpsCount.current >= 3 && onLowFPS) {
          onLowFPS(currentFps)
          lowFpsCount.current = 0
        }
      } else {
        lowFpsCount.current = 0
      }
    }
  })

  if (!enabled) return null

  return (
    <group>
      {/* This is a Three.js group - for HTML overlay, use Html from @react-three/drei */}
    </group>
  )
}

/**
 * HTML overlay version for displaying FPS outside Canvas
 */
export function FPSOverlay({ fps }: { fps: number }) {
  const color = fps >= 55 ? '#00ff88' : fps >= 30 ? '#ffcc00' : '#ff4444'
  
  return (
    <div style={{
      position: 'fixed',
      top: 8,
      left: 8,
      padding: '4px 8px',
      background: 'rgba(0,0,0,0.7)',
      color,
      fontFamily: 'monospace',
      fontSize: 12,
      borderRadius: 4,
      zIndex: 1000,
      pointerEvents: 'none'
    }}>
      {fps} FPS
    </div>
  )
}

/**
 * Hook for adaptive quality based on device performance
 */
export function useAdaptiveQuality() {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high')
  
  useEffect(() => {
    // Check device capabilities
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
    const hasFewCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
    
    if (isMobile || hasLowMemory || hasFewCores) {
      setQuality('low')
    } else if (hasLowMemory || hasFewCores) {
      setQuality('medium')
    }
  }, [])

  return { 
    quality, 
    setQuality,
    isLowEnd: quality === 'low',
    settings: {
      high: { mazeSize: 25, decorations: true, shadows: false, postProcessing: true },
      medium: { mazeSize: 20, decorations: true, shadows: false, postProcessing: false },
      low: { mazeSize: 15, decorations: false, shadows: false, postProcessing: false }
    }[quality]
  }
}

export default PerformanceMonitor
