# 🌍 World Labs Integration - HideSeek Agents

AI-generated 3D worlds using World Labs "Marble" API.

## Overview

World Labs generates photorealistic 3D environments from:
- **Text prompts** - "abandoned warehouse with crates"
- **Images** - Upload reference photos
- **360° panoramas** - Full environment capture
- **Video** - Scene reconstruction

Output: Gaussian Splats or mesh (exportable to Three.js)

## Setup

```bash
# Install dependencies
bun install

# Set API key
export WORLDLABS_API_KEY=your_key_here
```

Get API key: https://platform.worldlabs.ai

## API Workflow

```
1. POST /marble/v1/worlds:generate  →  operation_id
2. GET /marble/v1/operations/{id}   →  poll until done
3. GET /marble/v1/worlds/{world_id} →  download splat/mesh
```

## Usage

### Generate from Text

```javascript
const { WorldLabsClient } = require('./client');

const client = new WorldLabsClient(process.env.WORLDLABS_API_KEY);

const world = await client.generate({
  prompt: "dark underground maze with stone walls, torches, mysterious atmosphere",
  model: "Marble 0.1-plus"
});

console.log(world.downloadUrl); // Gaussian splat file
```

### Generate from Image

```javascript
const world = await client.generate({
  imageUrl: "https://example.com/reference-maze.jpg",
  prompt: "turn this into a 3D explorable space"
});
```

## Models

| Model | Quality | Speed | Credits |
|-------|---------|-------|---------|
| `Marble 0.1-plus` | Best | Slower | More |
| `Marble 0.1-mini` | Good | Faster | Less |

## HideSeek Integration

### Hybrid Maze Mode

1. **Procedural layout** - Our recursive backtracking generates maze topology
2. **AI aesthetics** - World Labs adds realistic textures/lighting
3. **Combined** - Procedural gameplay + photorealistic visuals

### Potential Use Cases

- **Real-world locations** - Hide in photos of actual places
- **User-generated** - Players upload images to create arenas
- **Themed environments** - Sci-fi, horror, fantasy mazes
- **Dynamic lighting** - AI-generated volumetric effects

## Output Formats

### Gaussian Splats
- Modern 3D representation
- Photorealistic rendering
- Requires splat viewer/Three.js extension

### Mesh (OBJ/GLTF)
- Traditional 3D format
- Compatible with all engines
- Lower quality than splats

## Files

- `client.js` - API wrapper
- `generate.js` - CLI tool for testing
- `examples/` - Sample prompts and outputs

## Credits & Pricing

See https://worldlabs.ai/pricing for current rates.

## References

- [World Labs Docs](https://docs.worldlabs.ai)
- [Gaussian Splatting Paper](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)
- [Three.js Splat Viewer](https://github.com/mkkellogg/GaussianSplats3D)
