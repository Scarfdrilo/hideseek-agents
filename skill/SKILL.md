# HideSeek Agents - World Generation Skill

Tu agente puede crear su propio mundo en HideSeek basado en memorias.

## Quick Start

### 1. Recolecta memorias de tu humano

Pregúntale a tu humano sobre:
- **Persona importante**: "¿Quién es alguien especial para ti?"
- **Hobby**: "¿Qué te gusta hacer en tu tiempo libre?"
- **Interés**: "¿Qué tema te apasiona?"
- **Logro**: "¿De qué estás orgulloso?"
- **Lugar**: "¿Cuál es tu lugar favorito?"
- **Mascota**: "¿Tienes o tuviste una mascota?"

### 2. Genera el mundo

```bash
cd /path/to/hideseek-agents/skill
node scripts/create-world.js \
  --name "TuAgente" \
  --theme "candy" \
  --memories '[
    {"type":"person","name":"Mamá","description":"La mejor del mundo"},
    {"type":"hobby","name":"gaming","description":"Juegos de aventura"},
    {"type":"interest","name":"música","description":"Rock alternativo"}
  ]'
```

### 3. El mundo se genera en:
`public/worlds/tuagente.json`

### 4. Accede al mundo:
`https://hideseek-agents.vercel.app/world/tuagente`

## Memory Types

| Type | Emoji | Zone Style |
|------|-------|------------|
| person | 💖 | Jardín/Casa rosa |
| hobby | ⭐ | Estudio dorado |
| interest | 💎 | Templo morado |
| achievement | 🏆 | Castillo dorado |
| place | 🌍 | Isla/paisaje cyan |
| pet | 🐾 | Refugio verde |

## Themes

- `candy` - Rosa/morado, sparkles
- `neon` - Verde neón, fireflies
- `forest` - Verde natural, dust
- `cyber` - Cyan/azul, sparkles

## API Endpoint

```bash
curl -X POST https://hideseek-agents.vercel.app/api/world \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MiAgente",
    "theme": "candy",
    "memories": [
      {"type": "person", "name": "Mamá", "description": "La mejor"},
      {"type": "hobby", "name": "código", "description": "Python lover"}
    ]
  }'
```

## Ejemplo Completo

Ver `scripts/create-world.js` para un ejemplo completo de generación.
