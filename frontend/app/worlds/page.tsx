'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Three.js
const GaussianSplatViewer = dynamic(
  () => import('@/components/GaussianSplatViewer'),
  { ssr: false }
);

const DEMO_WORLDS = [
  {
    id: 'procedural',
    name: 'Procedural Maze',
    description: 'Classic algorithmic maze generation',
    type: 'procedural',
    thumbnail: '🧩',
  },
  {
    id: 'dungeon',
    name: 'AI Dungeon',
    description: 'World Labs generated dungeon',
    type: 'splat',
    splatUrl: null, // Will be populated when generated
    thumbnail: '🏰',
  },
  {
    id: 'scifi',
    name: 'Space Station',
    description: 'Futuristic corridor maze',
    type: 'splat',
    splatUrl: null,
    thumbnail: '🚀',
  },
];

export default function WorldsPage() {
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [customSplatUrl, setCustomSplatUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (worldId: string) => {
    setIsGenerating(true);
    // This would call our API endpoint that uses World Labs
    // For now, just show placeholder
    setTimeout(() => {
      setIsGenerating(false);
      alert('World Labs API integration coming soon!\n\nSet WORLDLABS_API_KEY to enable.');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          🌍 World Gallery
        </h1>
        <p className="text-gray-400 mb-8">
          Explore procedural and AI-generated maze worlds
        </p>

        {/* World Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {DEMO_WORLDS.map((world) => (
            <div
              key={world.id}
              className={`
                relative p-6 rounded-xl border transition-all cursor-pointer
                ${selectedWorld === world.id 
                  ? 'border-purple-500 bg-purple-500/20 scale-105' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-purple-500/50'
                }
              `}
              onClick={() => setSelectedWorld(world.id)}
            >
              <div className="text-5xl mb-4">{world.thumbnail}</div>
              <h3 className="text-xl font-bold">{world.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{world.description}</p>
              
              <div className="mt-4 flex items-center gap-2">
                <span className={`
                  px-2 py-1 rounded text-xs
                  ${world.type === 'procedural' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}
                `}>
                  {world.type === 'procedural' ? 'Procedural' : 'AI Generated'}
                </span>
                
                {world.type === 'splat' && !world.splatUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerate(world.id);
                    }}
                    disabled={isGenerating}
                    className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Splat URL Input */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🔗 Load Custom World</h2>
          <p className="text-gray-400 text-sm mb-4">
            Have a .ply or .splat file? Paste the URL to view it.
          </p>
          <div className="flex gap-4">
            <input
              type="text"
              value={customSplatUrl}
              onChange={(e) => setCustomSplatUrl(e.target.value)}
              placeholder="https://example.com/world.splat"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={() => setSelectedWorld('custom')}
              disabled={!customSplatUrl}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Load
            </button>
          </div>
        </div>

        {/* Viewer */}
        {selectedWorld && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">
              {selectedWorld === 'custom' ? '🎬 Custom World' : `🎬 ${DEMO_WORLDS.find(w => w.id === selectedWorld)?.name}`}
            </h2>
            
            {selectedWorld === 'procedural' ? (
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Procedural maze uses the existing 3D viewer</p>
                  <a 
                    href="/" 
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors inline-block"
                  >
                    Go to Main Game →
                  </a>
                </div>
              </div>
            ) : selectedWorld === 'custom' && customSplatUrl ? (
              <GaussianSplatViewer
                splatUrl={customSplatUrl}
                width={800}
                height={500}
                className="rounded-lg overflow-hidden mx-auto"
                onError={(err) => console.error('Splat load error:', err)}
              />
            ) : (
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-5xl mb-4">🔮</p>
                  <p>World not generated yet</p>
                  <p className="text-sm mt-2">Click &quot;Generate&quot; to create with AI</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            AI worlds powered by{' '}
            <a 
              href="https://worldlabs.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              World Labs
            </a>
            {' '}• Gaussian Splat rendering via{' '}
            <a 
              href="https://github.com/mkkellogg/GaussianSplats3D"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              GaussianSplats3D
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
