import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Experience from './Experience'
import { ProbeControls } from './Utils/ProbeControls'

export default class Camera
{
    constructor()
    {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.canvas = this.experience.canvas
        this.instance = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height, 0.001, 10)
        this.instance.up.set(0, 0, 1)
        this.instance.position.set(0.2, 0.6, 0.1)
        this.experience.scene.add(this.instance)

        this.focusCanvas = () => this.canvas.focus({ preventScroll: true })
        this.canvas.addEventListener('pointerdown', this.focusCanvas)
        this.setMode('orbit')
    }

    setMode(mode, target = this.controls?.target.clone())
    {
        this.controls?.dispose()
        this.mode = mode
        if (mode === 'fly')
        {
            this.controls = new ProbeControls(this.instance, this.canvas)
        }
        else
        {
            this.instance.up.set(0, 0, 1)
            this.controls = new OrbitControls(this.instance, this.canvas)
            this.controls.enableDamping = true
            this.controls.dampingFactor = 0.12
            const extent = this.size?.length() ?? 0.5
            this.controls.minDistance = Math.min(0.04, extent * 0.16)
            this.controls.maxDistance = Math.max(2, extent * 4)
            this.controls.listenToKeyEvents(this.canvas)
        }
        if (target) this.controls.target.copy(target)
        this.controls.update()
        this.controls.addEventListener('change', () => this.experience.cameraChanged())
        this.experience.invalidate()
    }

    reset(size = this.size)
    {
        this.size = size
        const span = Math.max(size.z, Math.max(size.x, size.y) / Math.min(1, this.instance.aspect))
        this.instance.near = Math.min(0.001, span / 250)
        this.instance.far = Math.max(10, span * 8)
        this.instance.updateProjectionMatrix()
        this.instance.up.set(0, 0, 1)
        this.instance.position.set(0.38, 1, 0.08).normalize().multiplyScalar(span * 1.98)
        const center = new THREE.Vector3()
        this.instance.lookAt(center)
        this.setMode(this.mode, center)
    }

    resize()
    {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
        this.controls.handleResize?.()
    }

    update()
    {
        this.controls.update()
    }

    destroy()
    {
        this.canvas.removeEventListener('pointerdown', this.focusCanvas)
        this.controls.dispose()
        this.instance.removeFromParent()
    }
}
