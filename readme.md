# 🫀 ISO-Viewer

An interactive **cardiac CT data visualization tool** for the browser, built with **Three.js** and custom shaders.  
It demonstrates real-time **isosurface rendering** directly in WebGL.  

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

## 🚀 Live Demo
👉 [Try the demo here](https://xaralampidisbasilis.github.io/ISO-Viewer/)

> ⚠️ **Note:** The demo does **not** run on mobile devices. Please open it on a desktop or laptop with GPU acceleration enabled. It takes around 1 min to load 

---

## 🎮 Navigation

The viewer uses **first-person, spaceship-like movement** powered by custom **ProbeControls.js**.

### 🖱️ Mouse
- **Left drag** → Look around  
- **Middle scroll** → Zoom in/out  
- **Right drag** → Pan around

### ⌨️ Keyboard
- **W / S** → Move forward / backward  
- **A / D** → Move left / right  
- **R / F** → Move up / down  
- **Q / E** → Roll left / right  
- **Arrows** → Rotate view  
- **Space** → Move faster  
- **Shift** → Move slower

---

## 🛠️ Setup

First, install [Node.js](https://nodejs.org/en/download/).

Then run the following commands:

```bash
# Install dependencies (only required once)
npm install

# Start a local development server at localhost:8080
npm run dev

# Build for production (output in dist/ directory)
npm run build
```
<img width="1413" height="3990" alt="Cardiac-ReadMe-lowres" src="https://github.com/user-attachments/assets/cf7c23ee-a211-4fb9-a551-c5b3c6b11a81" />
