# HideSeek Agents - Frontend

3D maze visualization with Three.js + Next.js.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **Three.js** (3D rendering)
- **@react-three/fiber** (React renderer for Three.js)
- **@react-three/drei** (Helpers for R3F)
- **TypeScript**

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Connect repo in Vercel dashboard
3. Deploy automatically

Or use Vercel CLI:

```bash
npm i -g vercel
vercel --prod
```

## Features

- **3D Maze Visualization** — Walls, floors, hiding spots rendered in real-time
- **Camera Controls** — Orbit, pan, zoom with mouse
- **Procedural Generation** — Integrated with `ai-agents/world-generator`
- **Responsive Design** — Works on desktop and mobile

## TODO (Phase 4+)

- [ ] First-person controls (WASD movement)
- [ ] Wallet integration (MetaMask)
- [ ] WebSocket connection to backend
- [ ] Multiplayer lobby
- [ ] Hiding spot interaction
- [ ] Timer and game phases UI
- [ ] Leaderboard
- [ ] Betting interface (connect to smart contracts)

## File Structure

```
frontend/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/
│   ├── MazeViewer.tsx   # 3D viewer container
│   └── Maze3D.tsx       # Three.js maze rendering
├── next.config.js
├── tsconfig.json
└── package.json
```

## Integration with World Generator

In production, the frontend will call a backend API:

```typescript
const response = await fetch('/api/generate-maze', {
  method: 'POST',
  body: JSON.stringify({ seed: 12345, difficulty: 'medium' })
})
const { maze, hidingSpots } = await response.json()
```

For now, maze generation is client-side (demo mode).

## Deployment Checklist

- [x] Next.js app structure
- [x] Three.js 3D rendering
- [x] Basic maze visualization
- [ ] Backend API integration
- [ ] Wallet connection
- [ ] Smart contract interaction
- [ ] WebSocket real-time updates
