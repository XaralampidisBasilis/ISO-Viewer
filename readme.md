# 🫀 ISO-Viewer

An interactive **cardiac CT data visualization tool** for the browser, built with **Three.js** and custom shaders.  
It demonstrates real-time **isosurface rendering** directly in WebGL.  

---

## 🚀 Live Demo
👉 [Try the demo here](https://xaralampidisbasilis.github.io/ISO-Viewer/)

> ⚠️ **Note:** The demo does **not** run on mobile devices. Please open it on a desktop or laptop with GPU acceleration enabled.

---

## 🎮 Navigation Controls

The viewer uses **ProbeControls**, combining free-fly (FPS) movement and trackball-style camera control.

### 🖱️ Mouse
- **Left drag** → Look around  
- **Middle scroll** → Zoom in or out  
- **Right drag** → Pan

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
