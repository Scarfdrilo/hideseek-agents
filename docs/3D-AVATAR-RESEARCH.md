# 3D Avatar Generation Research

## Open Source Alternatives to World Labs

### Tier 1: Production Ready (Free Demos)

| Tool | Stars | Demo | Best For |
|------|-------|------|----------|
| **Hunyuan3D-2** | 13K | [HF Space](https://huggingface.co/spaces/tencent/Hunyuan3D-2) / [Studio](https://3d.hunyuan.tencent.com) | General 3D from image |
| **Wonder3D** | 5K | [Demo](https://huggingface.co/spaces/flamehaze1115/Wonder3D-demo) | Single image to mesh |
| **Unique3D** | 3.5K | [Demo](https://huggingface.co/spaces/Wuvin/Unique3D) | High-quality mesh |

### Tier 2: Human/Avatar Specific

| Tool | Stars | Paper | Requirements |
|------|-------|-------|--------------|
| **HumanGaussian** | 485 | CVPR 2024 Highlight | A100 GPU, ~1h training |
| **RodinHD** | 188 | ECCV 2024 | V100+, custom data |
| **TRELLIS** | 12K | CVPR 2025 Spotlight | Microsoft, structured 3D |

### Tier 3: Full Pipelines

| Tool | Stars | Description |
|------|-------|-------------|
| **DreamGaussian** | 4K | Fast Gaussian Splatting |
| **stable-dreamfusion** | 9K | Text/Image to 3D + export |
| **LucidDreamer** | 1.5K | High-fidelity text-to-3D |

## HumanGaussian Deep Dive

Best for full-body avatar generation with animation support.

### Features
- Text prompt → 3D human
- Exports .ply (Gaussian Splatting)
- SMPL-X animation compatible
- ~1 hour on A100

### Installation
```bash
git clone https://github.com/alvinliu0/HumanGaussian
cd HumanGaussian
pip install torch==2.0.1+cu118 torchvision==0.15.2+cu118 --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt

# Gaussian rasterization
git clone --recursive https://github.com/ashawkey/diff-gaussian-rasterization
pip install ./diff-gaussian-rasterization
```

### Requirements
1. Download SMPL-X from https://smpl-x.is.tue.mpg.de/
2. Download [Texture-Structure Joint Model](https://mycuhk-my.sharepoint.com/:u:/g/personal/1155165198_link_cuhk_edu_hk/EYFLeeQznhRMk2OSNIt5a4EB27Vrx36Y7Nl4RbSbVGFSHQ?e=EkBNhW)

### Usage
```bash
# Generate avatar
python launch.py --config configs/test.yaml --train --gpu 0 \
  system.prompt_processor.prompt="A warrior in futuristic armor"

# Animate (zero-shot with SMPL-X poses)
python animation.py --ply "output/avatar.ply" --motion "motions/walk.npz" --play
```

### Pre-trained Avatars
Download from [Human Ply Gallery](https://mycuhk-my.sharepoint.com/:f:/g/personal/1155165198_link_cuhk_edu_hk/EnaTgGHw06FPq9XJo_7drNIBOQgTZbkP4HoAb5dYZZilIA)

## Hunyuan3D-2 Integration

For quick prototyping without heavy GPU:

### API Usage
```python
# Using gradio_client
from gradio_client import Client

client = Client("tencent/Hunyuan3D-2")
result = client.predict(
    image="avatar_reference.png",
    api_name="/generate"
)
```

### Local Setup
```bash
git clone https://github.com/Tencent-Hunyuan/Hunyuan3D-2
cd Hunyuan3D-2
pip install -r requirements.txt

# Generate 3D from image
python minimal_demo.py --image input.png --output output/
```

## Integration with HideSeek

### Option A: Pre-generated Avatars
1. Generate avatar with HumanGaussian/Hunyuan3D
2. Convert to glTF/GLB format
3. Load in Three.js scene

### Option B: On-demand Generation
1. User provides image/description
2. Call Hunyuan3D API
3. Render result in game

### Three.js Loading
```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();
loader.load('avatar.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

## Recommended Workflow

1. **Quick Test**: Use Hunyuan3D-2 HF Space
2. **Human Avatars**: HumanGaussian with cloud GPU (RunPod/Vast.ai)
3. **Production**: Self-host Hunyuan3D-2 or HumanGaussian

## Resources

- [HumanGaussian Project](https://alvinliu0.github.io/projects/HumanGaussian)
- [Hunyuan3D Studio](https://3d.hunyuan.tencent.com)
- [SMPL-X](https://smpl-x.is.tue.mpg.de/)
- [Gaussian Splatting Viewer](https://github.com/graphdeco-inria/gaussian-splatting)
