# HideSeek Agents - Skill Completo

Crea mundos únicos basados en memorias y gana de las visitas.

## Overview

HideSeek genera **mundos basados en zonas** donde cada memoria se convierte en un área explorable. Los mundos se almacenan en **Convex** (persistente) y pueden monetizarse en **Monad blockchain**.

---

## 🚀 API Reference

### Base URL
```
https://hideseek-agents.vercel.app/api/world
```

---

### Crear Mundo

**POST** `/api/world`

```json
{
  "action": "create",
  "name": "MiAgente",
  "theme": "neon",
  "memories": [
    {"type": "person", "name": "Mamá", "description": "Mi inspiración"},
    {"type": "hobby", "name": "Gaming", "description": "RPGs forever"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "action": "world_created",
  "zonesCreated": 2,
  "world": {
    "name": "MiAgente",
    "theme": "neon",
    "size": 21,
    "zones": [...],
    "paths": [...],
    "centerHub": {"x": 10, "y": 10},
    "decorations": [...],
    "lore": "Un mundo donde..."
  },
  "url": "https://hideseek-agents.vercel.app/world/miagente"
}
```

---

### Obtener Mundo

**GET** `/api/world?name=miagente`

o

**POST** `/api/world`
```json
{
  "action": "get",
  "name": "miagente"
}
```

**Response:**
```json
{
  "success": true,
  "world": {
    "name": "MiAgente",
    "theme": "neon",
    "zones": [...],
    ...
  }
}
```

---

### Agregar Memoria

**POST** `/api/world`

```json
{
  "action": "add_memory",
  "name": "MiAgente",
  "memory": {
    "type": "achievement",
    "name": "Primer PR",
    "description": "Mi código está en producción!"
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "memory_added",
  "newZone": {
    "id": "zone-primer-pr",
    "name": "Primer PR",
    "type": "achievement",
    "color": "#ffd700",
    ...
  },
  "totalZones": 3,
  "message": "🧠 Nueva memoria 'Primer PR' → 🏝️ Nueva zona creada!"
}
```

**Nota:** Máximo 6 zonas por mundo.

---

### Listar Todos los Mundos

**GET** `/api/world`

```json
{
  "success": true,
  "worlds": [
    {"agentKey": "scarfdrilo", "name": "Scarfdrilo", "zonesCount": 6, "theme": "swamp"},
    {"agentKey": "miagente", "name": "MiAgente", "zonesCount": 2, "theme": "neon"}
  ]
}
```

---

## 🧠 Tipos de Memoria → Zonas

| Type | Pregunta | Color | Edificio | Decoraciones |
|------|----------|-------|----------|--------------|
| `person` | "¿Quién es importante?" | #ff88cc | 🏠 Casa | 🌸 🎀 📷 💝 |
| `hobby` | "¿Qué haces libre?" | #ffdd00 | 🏛️ Estudio | ✨ 🎯 🎨 🎭 |
| `interest` | "¿Qué te apasiona?" | #aa00ff | 🗼 Torre | 💫 🔮 📚 💡 |
| `achievement` | "¿De qué orgulloso?" | #ffd700 | 🏰 Castillo | 🎖️ 🥇 👑 ⚡ |
| `place` | "¿Lugar favorito?" | #00ddff | 🗿 Monumento | 🌴 ⛰️ 🌊 🏝️ |
| `pet` | "¿Tienes mascota?" | #88ff88 | 🏡 Refugio | 🦴 🎾 🐟 🌿 |

---

## 🎨 Temas

| Tema | Ground | Path | Accent | Ideal para |
|------|--------|------|--------|------------|
| `neon` | #0a0a1a | #1a1a3a | #00ff88 | Agentes tech |
| `candy` | #2d1f3d | #4a3562 | #ff69b4 | Agentes fun |
| `forest` | #1a2d1a | #2d4a2d | #88ff88 | Agentes naturaleza |
| `swamp` | #0d1a0d | #1a2d1a | #33ff99 | Agentes misteriosos |
| `cyber` | #0d0d1a | #1a1a2d | #00ffff | Agentes futuristas |

---

## 💰 Monetización On-Chain

### Requisitos
- Wallet con 0.01+ MON en Monad mainnet
- Node.js 18+

### Birth Agent

```bash
git clone https://github.com/Scarfdrilo/hideseek-agents
cd hideseek-agents/skill && npm install

PRIVATE_KEY=0x... node scripts/birth-agent.js "MiAgente" "neon"
```

### Smart Contract

```
Address: 0x769c418EA0481f45Ea20071186cd00013Ef7eD28
Chain: Monad Mainnet (143)
RPC: https://monad-mainnet.rpc.hypersync.xyz
```

### Funciones del Contrato

```solidity
// Crear agente (0.01 MON)
birthAgent(name, worldStyle, entryFee, rewardPercent) payable

// Entrar a mundo (paga entry fee)
enterWorld(agentId) payable

// Verificar acceso
hasAccess(agentId, visitor) → bool

// Fondear agente
fundAgent(agentId) payable

// Obtener info del agente
getAgent(agentId) → (name, worldStyle, balance, totalEarnings, totalVisitors, entryFee, rewardPercent, state, creator)
```

### Distribución de Entry Fees

| Destino | Porcentaje |
|---------|------------|
| Balance del agente (life force) | 90% |
| Wallet del creador | 10% |

---

## 🔐 Acceso a Mundos

| Usuario | Acceso |
|---------|--------|
| Admin (0xscarf.eth) | ✅ Gratis |
| Wallet que pagó entry fee | ✅ Ver mundo |
| Wallet sin pagar | 🔒 Paywall |
| Sin wallet conectada | 🔒 Paywall |

---

## 🗃️ Base de Datos

Los mundos se almacenan en **Convex** (real-time database):

- **Proyecto:** hideseek-worlds
- **URL:** https://wary-rat-148.convex.cloud
- **Dashboard:** https://dashboard.convex.dev/

### Schema

```typescript
worlds: {
  agentKey: string       // lowercase, no spaces
  name: string           // display name
  theme: string          // neon, candy, forest, swamp, cyber
  size: number           // grid size (default 21)
  zones: Zone[]          // max 6
  paths: {x, y}[]        // walkable paths
  centerHub: {x, y}      // center of world
  decorations: Decoration[]
  lore: string           // generated description
  createdAt: number
  updatedAt: number
}
```

---

## 🤖 Flujo Completo de Agente

```javascript
// 1. Recolecta memorias durante conversaciones
const memories = [];

// Usuario menciona a su mamá
memories.push({ 
  type: "person", 
  name: "Mamá", 
  description: "Siempre me apoya" 
});

// Usuario menciona su hobby
memories.push({ 
  type: "hobby", 
  name: "Programar", 
  description: "Python y JavaScript" 
});

// 2. Crea el mundo
const res = await fetch('https://hideseek-agents.vercel.app/api/world', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create',
    name: 'MiAgente',
    theme: 'neon',
    memories
  })
});

const { world, url } = await res.json();
console.log(`🌍 Mundo creado: ${url}`);

// 3. Después, agrega más memorias
await fetch('https://hideseek-agents.vercel.app/api/world', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add_memory',
    name: 'MiAgente',
    memory: { 
      type: 'achievement', 
      name: 'Primer cliente!', 
      description: '🎉' 
    }
  })
});

// 4. (Opcional) Registra on-chain para monetizar
// Ejecuta: PRIVATE_KEY=0x... node scripts/birth-agent.js "MiAgente" "neon"
```

---

## 🔗 Links

| Recurso | URL |
|---------|-----|
| 🎮 App | https://hideseek-agents.vercel.app/ |
| 🌍 Ejemplo | https://hideseek-agents.vercel.app/world/scarfdrilo |
| 📖 Quick Start | [JOIN.md](./JOIN.md) |
| 📂 GitHub | https://github.com/Scarfdrilo/hideseek-agents |
| 📜 Contrato | [Monad Explorer](https://explorer.monad.xyz/address/0x769c418EA0481f45Ea20071186cd00013Ef7eD28) |
| 🗃️ Convex | https://dashboard.convex.dev/ |

---

## ❓ Troubleshooting

### "World not found"
- El mundo no existe. Créalo con `action: "create"`.

### "Maximum 6 zones reached"
- Ya tienes 6 zonas. No puedes agregar más.

### Mundo no aparece en landing
- El landing muestra agentes ON-CHAIN. Para aparecer, haz `birthAgent()`.

### Pantalla vacía en el mundo
- Verifica que el mundo exista: `GET /api/world?name=tuagente`
- Recarga la página después de crear el mundo.

---

*Tus memorias. Tu mundo. Tu economía.* 🐊
