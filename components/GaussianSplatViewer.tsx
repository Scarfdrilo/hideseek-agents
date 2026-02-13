'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Dynamic import for GaussianSplats3D (it's a heavy library)
let GaussianSplats3D: any = null;

interface GaussianSplatViewerProps {
  splatUrl: string;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  // Camera controls
  initialPosition?: [number, number, number];
  enableControls?: boolean;
}

export default function GaussianSplatViewer({
  splatUrl,
  width = 800,
  height = 600,
  className = '',
  onLoad,
  onError,
  initialPosition = [0, 2, 5],
  enableControls = true,
}: GaussianSplatViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !splatUrl) return;

    const initViewer = async () => {
      try {
        // Dynamically import GaussianSplats3D
        if (!GaussianSplats3D) {
          const module = await import('@mkkellogg/gaussian-splats-3d');
          GaussianSplats3D = module;
        }

        // Create viewer
        const viewer = new GaussianSplats3D.Viewer({
          cameraUp: [0, 1, 0],
          initialCameraPosition: initialPosition,
          initialCameraLookAt: [0, 0, 0],
          selfDrivenMode: true,
          useBuiltInControls: enableControls,
          rootElement: containerRef.current,
          dynamicScene: true,
        });

        viewerRef.current = viewer;

        // Load splat with progress tracking
        await viewer.addSplatScene(splatUrl, {
          showLoadingUI: false,
          progressCallback: (progress: number) => {
            setProgress(Math.round(progress * 100));
          },
        });

        setLoading(false);
        onLoad?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load splat');
        setError(error.message);
        setLoading(false);
        onError?.(error);
      }
    };

    initViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [splatUrl, initialPosition, enableControls, onLoad, onError]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (viewerRef.current && containerRef.current) {
        // GaussianSplats3D handles its own resize
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div 
        className={`bg-red-900/50 border border-red-500 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <p className="text-red-400 font-bold">Error Loading World</p>
          <p className="text-red-300 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      {loading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white mt-4">Loading 3D World...</p>
            <p className="text-purple-400 text-sm">{progress}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Alternative: Simple PLY/Splat loader using raw Three.js
// For environments where GaussianSplats3D is too heavy
export function SimpleSplatViewer({ splatUrl, ...props }: GaussianSplatViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Basic Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(
      75,
      (props.width || 800) / (props.height || 600),
      0.1,
      1000
    );
    camera.position.set(...(props.initialPosition || [0, 2, 5]));
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(props.width || 800, props.height || 600);
    containerRef.current.appendChild(renderer.domElement);

    // Add placeholder geometry until splat is loaded
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x9333ea,
      wireframe: true 
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Simple animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    setLoading(false);

    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [splatUrl, props.width, props.height, props.initialPosition]);

  return (
    <div className={`relative ${props.className || ''}`}>
      <div ref={containerRef} style={{ width: props.width || 800, height: props.height || 600 }} />
      {loading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-yellow-400">
        Fallback viewer (Splat rendering requires GaussianSplats3D)
      </div>
    </div>
  );
}
