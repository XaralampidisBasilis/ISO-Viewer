# ISOViewer

Explore a **head-and-neck CT angiogram** with an interactive isosurface renderer built with Three.js, TensorFlow.js, and WebGL2. The demo opens a 10.8 MiB preview and loads the 84 MiB source scan when you select **High detail**.

[Open the demo](https://xaralampidisbasilis.github.io/ISO-Viewer/)

See the [project overview](PROJECT_OVERVIEW.md) for the architecture, rendering pipeline, and development reference.

---
## 📄 Related Publication (IEEE)

> **High-Quality Analytic Isosurface Rendering for Web-Based Cardiac Imaging**  
> Vasileios Lazaros Charalampidis, M. Louis Handoko, Eduard Ródenas-Alesinao,  
> Folkert W. Asselbergs, Konstantinos Votis, Paschalis Bizopoulos, Andreas Triantafyllidis  
>
> **Published in:** 2025 IEEE 25th International Conference on Bioinformatics and Bioengineering (BIBE)  
>
> **DOI:** https://doi.org/10.1109/BIBE66822.2025.00019  
> **IEEE Xplore:** https://ieeexplore.ieee.org/document/11273635/authors#authors

### Abstract 
This work presents a fully browser-native analytic isosurface renderer for volumetric medical data.  
It supports **trilinear and tricubic interpolation**, **sub-voxel accurate surface reconstruction**, **empty-space skipping for tricubic fields**, and a **novel Bernstein-polynomial-based early rejection test**, achieving up to **1.5× speedups**.  
The system reaches **25–45 FPS** on contrast-enhanced cardiac CT volumes using consumer-grade hardware, and was positively evaluated by clinicians for improved data understanding and communication.

---

## Exploring the scan

Start in **Orbit** mode and drag to rotate, scroll or pinch to zoom, and right-drag to pan. **Reset view** returns to the opening angle.

In **Fly** mode, click the viewport to focus it. Drag to look around, use **W/A/S/D** to move, **R/F** to move vertically, and **Q/E** to roll. Arrow keys rotate the view. **Space** increases speed and **Shift** reduces it.

Use **Rendering methods** to compare interpolation, traversal, and empty-space skipping. **Diagnostics** visualizes normals, principal curvatures, or traversal and intersection counts.

## Local development

Use Node.js and a browser with GPU-accelerated WebGL2. Open the development address printed by Vite.

```bash
npm ci
npm run dev
```

`npm run build` regenerates the GitHub Pages demo in `docs/`. To recreate the preview from the bundled CTA, run `node scripts/generate-cta-preview.mjs` before building.
