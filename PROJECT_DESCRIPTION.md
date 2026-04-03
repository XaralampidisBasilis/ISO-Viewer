# Full Project Description

ISO-Viewer is a browser-native volumetric visualization project built around one very specific goal: rendering high-quality isosurfaces directly from medical image volumes in real time, without first converting those volumes into polygon meshes. In practice, that means the project takes scalar medical data stored in NIfTI files, preprocesses it on the GPU, and then ray-marches the resulting implicit surface in WebGL2 using custom shader code. The repository is therefore more than a simple Three.js demo. It is a compact research-oriented rendering system that happens to run entirely in the browser.

At a high level, the project sits at the intersection of scientific visualization, medical imaging, and GPU programming. Its primary use case is cardiac CT visualization, but the repository also includes colon and head datasets, along with segmentation labels and paper assets that place the implementation in a broader academic context. The README ties the code to an IEEE publication on analytic isosurface rendering for web-based cardiac imaging, and the overall structure of the repo reflects that research focus: the code is organized not only to display a volume, but to expose different interpolation, gradient, marching, and empty-space skipping strategies so they can be compared and tuned interactively.

## What The Application Does

When the viewer starts, it creates a full-screen WebGL canvas and initializes TensorFlow.js on the WebGL backend. It then loads a NIfTI volume, converts it into a structured in-memory representation, computes several derived volume maps, uploads them as 3D textures, and finally renders a box that behaves as the sampling domain for the volume. The visible surface is not a mesh stored on disk. It is an isosurface reconstructed on the fly inside the fragment shader by tracing rays through the scalar field and finding where the field equals the selected isovalue.

This is an important distinction because it explains why so much of the repository is dedicated to preprocessing and shader logic. The viewer is not just displaying existing geometry; it is constructing the perceived surface analytically from volume data every frame. That design makes the project particularly useful for exploring sub-voxel detail, comparing interpolation quality, and experimenting with acceleration techniques such as occupancy maps, bounding boxes, and directional distance maps.

## Core Runtime Architecture

The application entry point is `src/script.js`. That file exposes a small lifecycle API through `window.ISOViewer`, which allows the viewer to be created, recreated, or destroyed externally. This suggests the project is meant to be embeddable in a larger application, not only run as a standalone demo. Startup begins by enabling and configuring TensorFlow.js, checking for WebGL2 support, and then instantiating the main `Experience` object.

`Experience` is the central coordinator of the runtime. It wires together the main subsystems:

- `Configs` for application state and rendering options
- `Sizes` and `Time` for resize and frame-loop events
- `Camera` and `Renderer` for scene rendering
- `Resources` for asynchronous file loading
- `Computes` for TensorFlow.js preprocessing and texture generation
- `World` for scene content
- `GUI` for lil-gui controls
- `Stats` for runtime monitoring

This is a classic scene-manager pattern, but adapted to a research visualization workflow. The event wiring is especially important: once resources are ready, preprocessing begins; once preprocessing finishes, the world and GUI are initialized; when config values change, both the compute pipeline and the rendering layer respond. That makes the viewer feel interactive even though it depends on several nontrivial preprocessing stages.

## Data Loading And Volume Representation

The project uses a custom `NIFTILoader` in `src/javascript/Utils/NIFTILoader.js`. This loader reads compressed or uncompressed NIfTI files, parses the header with `nifti-reader-js`, converts voxel data into the correct typed array, and computes physical metadata such as dimensions, spacing, and size. One thoughtful touch is that it normalizes spatial units into meters, which gives the rest of the system a consistent physical interpretation of the volume regardless of how the original file encodes its units.

The `Resources` system treats NIfTI files as first-class assets alongside textures or models, even though this project is almost entirely volume-centric. The default configuration points to a cardiac CT volume in `static/nifti/cardiac/ct_train_1002_image.nii.gz`, but the viewer can also take a custom NIfTI path from the URL query string through `getSourcesFromUrl()`. That means the app is not locked to the bundled samples; it is structured to accept alternate datasets with minimal ceremony.

## The GPU Preprocessing Pipeline

The `Computes` subsystem is the technical heart of the project. It converts the loaded volume into a set of intermediate representations that make real-time rendering feasible. These computations are not carried out on a server and not pre-baked into the repository. They happen in the browser using TensorFlow.js GPGPU programs that target the WebGL backend.

The pipeline begins with `VolumeMap`. This stage takes the raw scalar field, optionally downsamples it, and normalizes values into a range suitable for the rendering algorithms. Because medical volumes can be large, the downscaling step is a practical compromise between quality, memory use, and load time.

Next comes `InterpolationMap`, which precomputes augmented per-voxel features used for higher-quality interpolation. In the packed implementation, the shader stores values such as second-derivative-like terms and the base scalar value in a 3D RGBA half-float texture. This is what allows the fragment shader to approximate tricubic behavior more efficiently than reconstructing everything from scratch per sample.

`ExtremaMap` builds block-level min/max bounds. This is a crucial acceleration structure: by knowing the range of values inside a block, the renderer can quickly decide whether an isosurface at the current threshold might exist there. The implementation is especially interesting because it does not only compute bounds for simple trilinear sampling. It also computes tricubic-oriented bounds using Bernstein coefficients, which supports the repository's research emphasis on analytic and early-rejection methods for higher-order interpolation.

From there, the pipeline creates an `OccupancyMap`, which marks which blocks are potentially relevant for the current isovalue. This can be further reduced into a bounding box that narrows the region the ray marcher needs to consider. Several distance-map variants are then derived from occupancy:

- `IsotropicDistanceMap`
- `AnisotropicDistanceMap`
- `ExtendedIsotropicDistanceMap`
- `ExtendedAnisotropicDistanceMap`

These maps encode how far the marcher can safely skip through empty space before it needs to test again. The anisotropic variants are especially notable because they carry directional information rather than a single scalar distance, enabling more aggressive skipping in a ray-dependent way. The extended variants pack richer distance information into integer textures with different formats and dimensional layouts.

Taken together, these preprocessing stages show the project's overall philosophy: spend GPU work upfront to create compact data structures that make the real-time rendering pass faster and smarter.

## Rendering And Shader Architecture

Once preprocessing is done, the `World` creates an `ISOViewer` object. The viewer itself is visually simple: it is a box mesh. But that box is only a proxy for the volume domain. A custom model matrix maps the unit box into volume coordinates so that the shader can treat it as a sampling container for the 3D textures.

The material attached to this box is defined in `ISOMaterial.js` and assembled from many GLSL chunks under `src/shaders/iso_viewer`. This chunked design is one of the clearest signs that the project has grown beyond a toy demo. The shader code is separated into:

- uniforms and constants
- typed structs for rays, blocks, cells, hits, traces, debug data, and statistics
- sampling helpers for scalar values and distance maps
- gradient and curvature computation
- ray-box and bounding-box intersection logic
- marching modules
- shading modules
- debug modules
- math, color, logical, and solver utilities

The vertex shader prepares positions and camera information in the volume's grid coordinate system. The fragment shader then performs the real work. It computes the viewing ray, intersects it with the volume bounds, optionally tightens the interval with a computed bounding box, and then enters one of the marching implementations.

Two major traversal modes appear in the configuration: a digital differential analyzer style approach and a uniform stepping mode. The code also distinguishes between cell-based and trace-based marching modules, reflecting experimentation with how the ray should advance through the field. Combined with occupancy and distance textures, these marchers let the project skip large empty regions rather than sampling blindly through the entire volume.

Interpolation is another major axis of experimentation. The viewer supports both trilinear and tricubic sampling. Trilinear is simpler and cheaper, while the tricubic path uses precomputed features to recover smoother and more accurate scalar behavior. This is one of the project's key differentiators: it treats interpolation quality as a first-class design concern, not just a checkbox feature.

The shading stage turns the geometric hit into an understandable image. Lighting is camera-relative, and the shader computes ambient, diffuse, and specular terms. On top of that, the final appearance can be modulated by edge response, gradient strength, and curvature estimates. Multiple colormaps are included, ranging from common scientific palettes like `viridis`, `plasma`, and `inferno` to more classic options like `jet`, `hot`, and `gray`. The result is a viewer that is not only mathematically sophisticated but visually tuned for inspection and comparison.

## Debugging And Experimentation

One of the strongest aspects of the repository is how clearly it was built for experimentation. The GUI exposes isovalue, interpolation method, gradient method, marching method, skipping method, and several toggles for features such as Bernstein rejection, skipping, and bounding-box restriction. Shading controls allow the user to change the colormap and material response. A dedicated debug panel exposes many internal shader diagnostics, including ray state, block state, cell state, trace state, hit state, root-finding state, and per-frame statistics.

This is not typical for a polished consumer-facing application, but it is exactly what you want in a research or algorithm-development tool. It means the project is designed not only to produce a final image, but also to make the rendering process inspectable. That is valuable when validating traversal logic, tuning thresholds, or visually explaining the effect of an acceleration method.

The controls reinforce this exploratory character. Instead of using standard orbit controls, the app uses custom `ProbeControls`, which combine first-person motion, panning, rolling, and zoom. That makes the viewer feel more like a probe moving around or through a volume rather than a camera orbiting a solid object. For medical or scientific data, that interaction style makes sense because the user often wants freedom to approach a structure from unusual angles or move inside a tight spatial region.

## Build, Deployment, And Project Layout

From a tooling perspective, the project is lightweight. Vite handles development and build output, and `vite-plugin-glsl` allows the shader code to be organized as composable source files rather than giant inline strings. The app serves `src/` as the project root, uses `static/` for public assets, and builds into `docs/`, which is a common pattern for GitHub Pages deployment.

The repository layout is clean and purposeful:

- `src/javascript` contains the runtime classes, controls, resource loading, and compute pipeline
- `src/shaders/iso_viewer` contains the rendering logic, broken into granular shader chunks
- `static/nifti` contains example volumes and labels
- `static/paper` contains the publication PDF and supporting references
- `static/images` contains visual outputs used for documentation or presentation

This layout makes the project feel like both a working application and a reproducible research artifact. Someone opening the repository can not only run the code, but also inspect the scientific context and test the implementation on included data.

## What Makes The Project Distinct

What makes ISO-Viewer stand out is the combination of browser accessibility and advanced rendering ideas. Many medical visualization systems rely on native applications, large frameworks, or offline preprocessing pipelines. This project shows that a modern browser, given WebGL2 and careful GPU preprocessing, can host surprisingly advanced analytic isosurface rendering techniques. It is not just drawing slices or showing a pre-extracted mesh. It is performing structured, configurable volume analysis and surface reconstruction interactively in client-side code.

At the same time, the repository still feels honest about its origins as a research prototype. Some modules are highly specialized, many configuration flags exist because different techniques are being compared, and resource management is explicit because GPU memory matters. Those qualities do not weaken the project; they explain it. ISO-Viewer is best understood as a serious experimental visualization engine packaged as a browser application.

In one sentence, the whole project is a self-contained web system that loads medical volumes, preprocesses them into acceleration-friendly 3D textures with TensorFlow.js, and renders analytically reconstructed isosurfaces with modular WebGL shaders, all while exposing the underlying algorithms for interactive exploration and comparison.
