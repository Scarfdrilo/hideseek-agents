# 🎮 HideSeek Agents - Demo Visual

## Landing Page

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                                                        │
│               🎮 HideSeek Agents                       │
│                                                        │
│          Adversarial AI Gaming on Monad                │
│                                                        │
│                                                        │
│            ╔═══════════════════════╗                   │
│            ║    🎮 Play Demo      ║                    │
│            ╚═══════════════════════╝                   │
│                                                        │
│                                                        │
│    AI Agents vs Humans • Procedural Worlds            │
│             • Winner Takes All                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Colores:**
- Background: Negro con gradiente (#1a1a1a → #0a0a0a)
- Título: Gradiente verde-azul brillante (#00ff88 → #00aaff)
- Botón: Verde neón con efecto glow

---

## 3D Maze View (Después de click en Play Demo)

```
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐                          │
│  │ 🎮 HideSeek Agents Demo  │  ← UI Overlay (top-left)│
│  │ Size: 21x21              │                          │
│  │ Hiding Spots: 5          │                          │
│  │                          │                          │
│  │ Controls:                │                          │
│  │ 🖱️ Left-click: Rotate    │                          │
│  │ 🖱️ Right-click: Pan      │                          │
│  │ 🖱️ Scroll: Zoom          │                          │
│  └──────────────────────────┘                          │
│                                                        │
│         3D VIEW (Three.js rendering):                  │
│                                                        │
│              ╔═══╗ ╔═══╗ ╔═══╗                         │
│              ║░░░║ ║░░░║ ║░░░║  ← Gray walls (3D)     │
│         ╔═══╗╚═══╝ ╚═══╝ ╚═══╝╔═══╗                   │
│         ║░░░║                   ║░░░║                   │
│         ╚═══╝  ▓▓▓▓▓▓▓▓▓▓▓▓▓  ╚═══╝                   │
│                ▓░░░░░░░░░░░▓   ← Dark floor           │
│         ╔═══╗  ▓░🔵░░░░░░░▓  ╔═══╗                    │
│         ║░░░║  ▓░░░░░░🟢░░▓  ║░░░║                    │
│         ╚═══╝  ▓░░░░░░░░░░▓  ╚═══╝                    │
│                ▓░░░🟢░░░░░▓                            │
│         ╔═══╗  ▓▓▓▓▓▓▓▓▓▓▓▓  ╔═══╗                    │
│         ║░░░║                 ║░░░║                    │
│         ╚═══╝ ╔═══╗ ╔═══╗   ╚═══╝                     │
│              ║░░░║ ║░░░║                               │
│              ╚═══╝ ╚═══╝                               │
│                                                        │
│  Camera: Isometric view (45° angle, top-down)         │
│  🔵 Start position (blue glow)                         │
│  🟢 Hiding spots (green glow + pulsing effect)         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Elementos 3D:**
- **Walls**: Cubos grises (#333), altura 2 unidades, sombras
- **Floor**: Placas negras (#222), altura 0.1 unidades
- **Start**: Floor azul (#00aaff) con glow
- **Hiding Spots**: Esferas verdes (#00ff88) flotando, emissive glow
- **Ground Plane**: Negro total (#111), 100x100 unidades
- **Lighting**: 
  - Luz ambiental suave
  - Luz direccional desde arriba-derecha
  - Point light desde esquina opuesta

**Controles:**
- Arrastra con mouse: Rota cámara alrededor del maze
- Click derecho + arrastra: Mueve (pan) la vista
- Scroll: Zoom in/out (límites: 10-50 unidades)

---

## Mapas Generados (ASCII Preview)

### Map 1 - EASY (15x15)

```
###############
#S....#.......#
#.###.###.###.#
#.#.#...#...#.#
#.#H###H###.#.#
#.#...#...#.#.#
#.###.###.#.#.#
#.#...#...#.#.#
#.#.#########.#
#.#...........#
#.#####.#####.#
#H..#...#.#...#
###.#.###.#.###
#.....#.......#
###############
```

**Stats:**
- Size: 15x15
- Difficulty: Easy
- Hiding Spots: 3 (marked as H)
- Start: Top-left (marked as S)

---

### Map 2 - MEDIUM (21x21)

```
#####################
#####################
##HS...........#...##
######.#######.#.#.##
##H..#.......#.#.#.##
##.#.###.###.#.#.#.##
##.#...#.#.#.#.#.#H##
##.###.#.#.#.###.#.##
##H..#.#...#...#.#.##
####.#.#####.#.#.#.##
##...#.....#.#...#.##
##.###############.##
##.#...........#...##
##.#######.###H#.#.##
##.....#...#.....#.##
######.#.#########.##
##...#.#.......#...##
##.###.#######.#.####
##.............#...##
#####################
#####################
```

**Stats:**
- Size: 21x21
- Difficulty: Medium
- Hiding Spots: 5
- More complex passages

---

### Map 3 - HARD (25x25)

```
#########################
#########################
##S........#.......#..H##
##.#######.#.#####.###.##
##.......#.#...#....H..##
########.#.#.#.##########
##.......#.#.#.........##
##.#######.#.#########.##
##.#H......#.........#.##
##.#######.#######.###.##
##.......#.....#...#...##
##.#####.#####.#####.#.##
##.#...#.#...#.#.....#.##
####.#.#.#.###.#.########
##...#.#.#.#.#.#....H..##
##.###.#.#.#.#H#.#####.##
##...#.H.#.#...#.....#.##
##.#.###.#H#.###.#####.##
##.#...#.#.#.#.#.#.....##
##.###.###.#.#.#.#.###H##
##...#.#...#.#...#.#.#.##
####.#.#.###.#####.#.#.##
##...#...#.........#...##
#########################
#########################
```

**Stats:**
- Size: 25x25
- Difficulty: Hard
- Hiding Spots: 8
- Maximum complexity

---

## How It Works

**1. Maze Generation:**
- Algorithm: Recursive Backtracking
- Guarantees: Fully connected, no isolated areas
- Seeded: Same seed = same maze (on-chain verifiable)

**2. Hiding Spot Detection:**
- Dead ends (3 walls, 1 opening) = Best spots
- Corners (2 walls, 2 openings) = Good spots
- Algorithm scans all floor tiles and ranks by "hidability"

**3. 3D Rendering:**
- Three.js + React Three Fiber
- Real-time camera controls
- Lighting + shadows for depth perception
- Glow effects on interactive elements

**4. Ready for Gameplay:**
- Click hiding spot → AI agent hides object there
- Timer starts → Seekers navigate maze
- Discovery tracked on-chain
- Rewards distributed via smart contracts

---

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript
- **3D Engine**: Three.js + @react-three/fiber
- **Hosting**: Vercel (auto-deploy from GitHub)
- **Backend** (Phase 4): Node.js + Socket.io + Railway
- **Blockchain**: Monad (contracts already compiled)

---

## Next Steps

1. **Configure Vercel** → Set Root Directory to `frontend`
2. **Phase 4** → Backend WebSocket server
3. **Wallet Integration** → MetaMask connect
4. **Deploy Contracts** → When MON arrives
5. **Multiplayer** → Real-time hide & seek matches

---

🎮 **Live demo running on:** http://localhost:3000 (server-side)

**GitHub:** https://github.com/Scarfdrilo/hideseek-agents

**Vercel:** Pending Root Directory config
