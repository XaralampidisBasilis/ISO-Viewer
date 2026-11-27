import * as THREE from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import fragmentShader from '../../../shaders/iso_viewer/capture.glsl'

const vertexShader = `
    uniform vec3 u_capture_origin;
    uniform vec3 u_capture_direction;
    uniform vec3 u_capture_camera_direction;
    out vec3 v_position;
    out vec3 v_camera_position;
    out vec3 v_camera_direction;
    out vec3 v_ray_direction;

    void main()
    {
        v_camera_position = u_capture_origin;
        v_camera_direction = u_capture_camera_direction;
        v_ray_direction = u_capture_direction;
        v_position = u_capture_origin + u_capture_direction;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`

/** Inspect one frozen camera ray using the renderer's GLSL traversal and current maps. */
export default class RayTraversalOverlay
{
    constructor(viewer, experience)
    {
        this.viewer = viewer
        this.experience = experience
        this.group = new THREE.Group()
        this.group.visible = false
        viewer.mesh.add(this.group)
        this.selection = null
        this.captureKey = null
        this.dirty = false
        this.selecting = false
        this.button = document.getElementById('select-ray')
        this.status = document.getElementById('ray-inspection-status')
        this.panel = document.getElementById('ray-inspection')
        const { canvas, abort } = experience
        const options = { signal: abort.signal }

        this.button.addEventListener('click', () => this.setSelecting(!this.selecting), options)
        canvas.addEventListener('pointerdown', event =>
        {
            if (!this.selecting || !event.isPrimary || event.button !== 0) return
            if (experience.loading || experience.applying || experience.pending.size) return

            // Consume the selection gesture before orbit/fly controls receive it.
            event.preventDefault()
            event.stopImmediatePropagation()
            this.select(event.clientX, event.clientY)
        }, { ...options, capture: true })
        document.addEventListener('keydown', event =>
        {
            if (event.key === 'Escape' && this.selecting) this.setSelecting(false)
        }, options)
    }

    setSelecting(selecting)
    {
        if (selecting) this.previousStatus = this.status.textContent
        this.selecting = selecting
        this.button.textContent = selecting ? 'Cancel selection' : 'Select ray'
        this.button.setAttribute('aria-pressed', String(selecting))
        this.experience.canvas.classList.toggle('ray-selecting', selecting)
        if (selecting) this.status.textContent = 'Click the scan to select a ray. Esc cancels.'
        else if (this.previousStatus) this.status.textContent = this.previousStatus
    }

    /** Freeze the ray in proxy-local coordinates so it follows the scan in either display space. */
    select(clientX, clientY)
    {
        const { canvas, camera } = this.experience
        const bounds = canvas.getBoundingClientRect()
        const pointer = new THREE.Vector2(
            (clientX - bounds.left) / bounds.width * 2 - 1,
            1 - (clientY - bounds.top) / bounds.height * 2,
        )
        camera.instance.updateMatrixWorld()
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(pointer, camera.instance)
        const size = this.viewer.size
        this.selection = {
            origin: raycaster.ray.origin.clone().divide(size),
            direction: raycaster.ray.direction.clone().divide(size),
            cameraDirection: camera.instance.getWorldDirection(new THREE.Vector3()).divide(size),
        }
        this.setSelecting(false)
        this.dirty = true
        this.experience.invalidate()
    }

    sync()
    {
        const { configs, computes } = this.experience
        const enabled = configs.rayInspectionVisible
        this.panel.hidden = !enabled
        this.group.visible = enabled
        if (!enabled && this.selecting) this.setSelecting(false)

        if (this.volume !== computes.volume)
        {
            this.volume = computes.volume
            this.selection = null
            this.dirty = false
            this.clear()
            this.status.textContent = 'Select ray, then click the scan. Rotate to inspect the path.'
        }

        const { defines, uniforms } = this.viewer.material
        const key = JSON.stringify([
            computes.interpolationMap.texture.uuid,
            computes.occupancyMap.texture.version,
            computes.distanceMap?.texture.uuid,
            computes.distanceMap?.texture.version,
            configs.isosurfaceValue,
            ...['MARCHING_METHOD', 'INTERPOLATION_METHOD', 'INTERSECTION_TEST', 'SKIPPING_STRATEGY',
                'SKIPPING_METHOD', 'SKIPPING_ENABLED', 'BBOX_ENABLED', 'BERNSTEIN_ENABLED',
                'VARIATION_METHOD', 'MAX_CELLS', 'MAX_BLOCKS'].map(name => defines[name]),
            uniforms.u_volume.value.block_size,
        ])
        if (key !== this.captureKey)
        {
            this.captureKey = key
            this.dirty = Boolean(this.selection)
        }

    }

    /** Run only after map updates finish, outside preprocessing measurements and ordinary frames. */
    update()
    {
        const { loading, applying, configs } = this.experience
        if (!this.dirty || loading || applying || !this.selection) return
        if (!configs.rayInspectionVisible) return
        this.dirty = false

        try
        {
            const capture = this.capture()
            this.draw(capture)
        }
        catch (error)
        {
            this.clear()
            this.status.textContent = error.message || 'Could not inspect the selected ray.'
            console.error(error)
        }
    }

    prepareCapture()
    {
        if (this.captureMaterial) return

        const renderer = this.experience.renderer.instance
        if (!renderer.extensions.has('EXT_color_buffer_float'))
            throw new Error('Ray inspection requires floating-point render targets on this GPU.')

        this.captureMaterial = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader,
            fragmentShader,
            uniforms: {
                ...this.viewer.material.uniforms,
                u_capture_origin: new THREE.Uniform(new THREE.Vector3()),
                u_capture_direction: new THREE.Uniform(new THREE.Vector3()),
                u_capture_camera_direction: new THREE.Uniform(new THREE.Vector3()),
            },
            depthTest: false,
            depthWrite: false,
            blending: THREE.NoBlending,
        })
        this.captureScene = new THREE.Scene()
        this.captureMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.captureMaterial)
        this.captureMesh.frustumCulled = false
        this.captureScene.add(this.captureMesh)
        this.captureCamera = new THREE.Camera()
        this.target = new THREE.WebGLRenderTarget(128, 3, {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            depthBuffer: false,
        })
    }

    /**
     * Rows hold [min,kind], [max,entry distance], [exit position,exit distance].
     * Columns 0–1 hold the frozen ray, hit, and event count. Coordinates are voxel-grid units.
     */
    capture()
    {
        this.prepareCapture()
        const { dimensions } = this.experience.computes.volumeMap
        const { uniforms } = this.captureMaterial
        uniforms.u_capture_origin.value.copy(this.selection.origin).addScalar(0.5).multiply(dimensions)
        uniforms.u_capture_direction.value.copy(this.selection.direction).multiply(dimensions).normalize()
        uniforms.u_capture_camera_direction.value.copy(this.selection.cameraDirection).multiply(dimensions).normalize()
        const defines = {
            ...this.viewer.material.defines,
            RAY_CAPTURE: 1,
            DEBUG_ENABLED: 0,
            DISCARDING_ENABLED: 1,
            WRITE_SURFACE_DEPTH: 0,
            OCCUPANCY_VIEW: 0,
            OCCUPANCY_WIREFRAME: 0,
        }
        const key = JSON.stringify(defines)
        if (key !== this.shaderKey)
        {
            this.shaderKey = key
            this.captureMaterial.defines = defines
            this.captureMaterial.needsUpdate = true
        }

        const renderer = this.experience.renderer.instance
        const previousTarget = renderer.getRenderTarget()
        const previousColor = renderer.getClearColor(new THREE.Color())
        const previousAlpha = renderer.getClearAlpha()
        let data

        try
        {
            renderer.setClearColor(0, 0)
            // Grow only if the first readback reports more events than fit.
            for (let pass = 0; pass < 2; pass++)
            {
                renderer.setRenderTarget(this.target)
                renderer.render(this.captureScene, this.captureCamera)
                data = new Float32Array(this.target.width * 3 * 4)
                renderer.readRenderTargetPixels(this.target, 0, 0, this.target.width, 3, data)
                const required = Math.round(data[4]) + 2
                if (required <= this.target.width) break
                if (required > renderer.capabilities.maxTextureSize)
                    throw new Error('This ray has too many traversal events to inspect on this GPU.')
                this.target.setSize(required, 3)
            }
        }
        finally
        {
            renderer.setRenderTarget(previousTarget)
            renderer.setClearColor(previousColor, previousAlpha)
        }

        const width = this.target.width
        const directionLength = Math.hypot(...data.subarray(width * 4, width * 4 + 3))
        if (Math.abs(directionLength - 1) > 0.001)
            throw new Error('The GPU could not capture the selected ray.')

        return { data, width }
    }

    /** Convert grid coordinates to the proxy's centered unit cube, shared by every overlay child. */
    local(point)
    {
        return point.clone().divide(this.experience.computes.volumeMap.dimensions).subScalar(0.5)
    }

    draw({ data, width })
    {
        this.clear()
        const read = (column, row) =>
        {
            const offset = (row * width + column) * 4
            return new THREE.Vector3().fromArray(data, offset)
        }
        const origin = read(0, 0)
        const direction = read(0, 1)
        const hit = read(0, 2)
        const hitState = data[width * 8 + 3]
        const start = data[3]
        const end = hitState === 1 ? hit.clone().sub(origin).dot(direction) : data[width * 4 + 3]
        const count = Math.round(data[4])
        this.captureResult = { origin, direction, hit, hitState, start, end, events: [] }

        if (hitState < 0)
        {
            this.status.textContent = 'The selected ray misses the volume or clipped bounds. Select another ray.'
            return
        }

        const blockMarkers = [this.local(origin.clone().addScaledVector(direction, start))]
        const fineMarkers = []
        const wirePositions = []
        const occupiedPositions = []
        for (let index = 2; index < count + 2; index++)
        {
            const kind = data[index * 4 + 3]
            const entry = data[(width + index) * 4 + 3]
            const exit = data[(width * 2 + index) * 4 + 3]
            if (entry > end || exit <= start) continue
            const minimum = read(index, 0)
            const maximum = read(index, 1)
            this.captureResult.events.push({ kind, minimum, maximum, entry, exit })
            const markers = kind === 2 ? fineMarkers : blockMarkers
            markers.push(this.local(origin.clone().addScaledVector(direction, Math.min(exit, end))))
            if (kind !== 1 && kind !== 3) continue

            const lo = this.local(minimum)
            const hi = this.local(maximum)
            const corners = Array.from({ length: 8 }, (_, corner) => [
                corner & 1 ? hi.x : lo.x,
                corner & 2 ? hi.y : lo.y,
                corner & 4 ? hi.z : lo.z,
            ])
            const positions = kind === 3 ? occupiedPositions : wirePositions
            for (const [a, b] of [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3],
                [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]])
                positions.push(...corners[a], ...corners[b])
        }
        const endpoint = this.local(origin.clone().addScaledVector(direction, end))
        const pathGeometry = new LineGeometry().setPositions([...this.local(origin).toArray(), ...endpoint.toArray()])
        const lineMaterial = new LineMaterial({
            color: 0xe6f2ff, linewidth: 2, transparent: true, opacity: 0.85, depthTest: false, depthWrite: false,
        })
        const path = new Line2(pathGeometry, lineMaterial)
        path.renderOrder = 10
        this.group.add(path)
        for (const [markers, size] of [[fineMarkers, 3], [blockMarkers, 5]])
        {
            if (!markers.length) continue
            const visits = new THREE.Points(new THREE.BufferGeometry().setFromPoints(markers),
                new THREE.PointsMaterial({ color: 0xe6f2ff, size, sizeAttenuation: false, transparent: true, depthTest: false, depthWrite: false }))
            visits.renderOrder = 11
            this.group.add(visits)
        }
        for (const [positions, color, opacity, order] of [
            [wirePositions, 0x53c9f4, 0.8, 10],
            [occupiedPositions, this.viewer.boundingBox.material.color, 0.8, 10],
        ])
        {
            if (!positions.length) continue
            const geometry = new LineSegmentsGeometry().setPositions(positions)
            const wireframe = new LineSegments2(geometry, new LineMaterial({
                color, linewidth: 2, transparent: true, opacity, depthTest: false, depthWrite: false,
            }))
            wireframe.renderOrder = order
            this.group.add(wireframe)
        }
        if (hitState === 1)
        {
            if (!this.hitMarkerTexture)
            {
                const canvas = document.createElement('canvas')
                canvas.width = canvas.height = 32
                const context = canvas.getContext('2d')
                context.beginPath()
                context.arc(16, 16, 14, 0, Math.PI * 2)
                context.fillStyle = '#ffffff'
                context.fill()
                context.strokeStyle = '#392934'
                context.lineWidth = 4
                context.stroke()
                this.hitMarkerTexture = new THREE.CanvasTexture(canvas)
            }
            const marker = new THREE.Points(new THREE.BufferGeometry().setFromPoints([this.local(hit)]),
                new THREE.PointsMaterial({ color: 0xff6587, map: this.hitMarkerTexture, size: 9, sizeAttenuation: false, transparent: true, depthTest: false, depthWrite: false }))
            marker.renderOrder = 12
            this.group.add(marker)
        }
        this.status.textContent = ''
        this.sync()
    }

    clear()
    {
        for (const child of [...this.group.children])
        {
            child.geometry.dispose()
            child.material.dispose()
            child.removeFromParent()
        }
        this.captureResult = null
    }

    destroy()
    {
        this.setSelecting(false)
        this.clear()
        this.group.removeFromParent()
        this.target?.dispose()
        this.hitMarkerTexture?.dispose()
        this.captureMesh?.geometry.dispose()
        this.captureMaterial?.dispose()
    }
}
