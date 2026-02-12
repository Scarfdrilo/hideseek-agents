# Three.js Optimization Roadmap

## Current State ✅
- No shadows (saves ~40% GPU)
- 3 lights only (minimal lighting)
- Simple fog for depth culling
- 25x25 maze (625 cells max)

## High Impact Optimizations

### 1. Instanced Meshes (🔥 HUGE impact)
Instead of creating 300+ individual wall meshes, use `InstancedMesh`:
```typescript
// ONE draw call for ALL walls
const wallGeometry = new BoxGeometry(1, 2, 1)
const wallMaterial = new MeshStandardMaterial({ color: 0x333344 })
const wallInstances = new InstancedMesh(wallGeometry, wallMaterial, wallCount)
```
**Expected improvement:** 10-50x fewer draw calls

### 2. Geometry Merging
Merge all static geometries into one:
```typescript
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'
const merged = mergeBufferGeometries(geometries)
```
**Expected improvement:** Single draw call for floor

### 3. LOD (Level of Detail)
Reduce detail for distant objects:
```typescript
const lod = new LOD()
lod.addLevel(highDetailMesh, 0)    // < 10 units
lod.addLevel(mediumDetailMesh, 10)  // 10-30 units
lod.addLevel(lowDetailMesh, 30)     // > 30 units
```

### 4. Frustum Culling Optimization
Group objects spatially for faster culling:
```typescript
// Chunk maze into 5x5 sections
// Only render chunks visible to camera
```

### 5. Reduce Polygon Count
Current decorations (crystals, mushrooms):
- Crystal: 8 sides → reduce to 4
- Mushroom: 12 segments → reduce to 6
- Flowers: 6 petals → reduce to 4

### 6. Texture Atlasing
Single texture for all materials:
- Wall texture
- Floor texture  
- Decoration textures
**Benefit:** Fewer material switches

### 7. Object Pooling
Reuse mesh objects instead of creating/destroying:
```typescript
const pooledMeshes = []
// Get from pool, return to pool
```

## Quick Wins (Do First)

1. ✅ Disable shadows (DONE)
2. ✅ Reduce light count (DONE)  
3. ⬜ Use InstancedMesh for walls
4. ⬜ Merge floor geometry
5. ⬜ Add performance monitor

## Performance Targets

| Device | Target FPS |
|--------|-----------|
| Desktop | 60 fps |
| Mobile | 30 fps |
| Low-end mobile | 20 fps |

## Measurement

Add stats.js:
```typescript
import Stats from 'three/examples/jsm/libs/stats.module'
const stats = new Stats()
document.body.appendChild(stats.dom)
// In render loop: stats.update()
```

## Progressive Loading

1. Show loading screen
2. Generate maze data (CPU)
3. Create low-poly placeholder
4. Stream in detailed geometry
5. Add decorations last

## Memory Management

- Dispose geometries/materials when not needed
- Use WeakMap for caching
- Clear texture cache periodically

## Mobile-Specific

- Reduce maze size: 25x25 → 15x15 on mobile
- Skip decorations on low memory
- Use simpler shaders
- Reduce fog distance

---

## Priority for Hackathon

**Week 1:** InstancedMesh for walls (biggest impact)
**Week 1:** Merge floor geometry
**Week 2:** Mobile maze size reduction
**Week 2:** Performance stats monitoring
