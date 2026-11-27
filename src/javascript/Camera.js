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
        this.unitsPerMeter = 1
        this.instance = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height, 0.001, 10)
        this.instance.up.set(0, 0, 1)
        this.instance.position.set(0.2, 0.6, 0.1)
        this.experience.scene.add(this.instance)

        this.focusCanvas = () => this.canvas.focus({ preventScroll: true })
        this.canvas.addEventListener('pointerdown', this.focusCanvas)
        this.setMode('orbit')
    }

    setMode(mode, target = this.controls?.target.clone(), orbitUp)
    {
        this.controls?.dispose()
        this.mode = mode
        if (mode === 'fly')
        {
            this.controls = new ProbeControls(this.instance, this.canvas)
            this.controls.movementSpeed *= this.unitsPerMeter
        }
        else
        {
            if (orbitUp) this.instance.up.copy(orbitUp)
            else this.instance.up.set(0, 0, 1)
            this.controls = new OrbitControls(this.instance, this.canvas)
            this.controls.enableDamping = true
            this.controls.dampingFactor = 0.12
            const extent = this.size?.length() ?? 0.5
            this.controls.minDistance = Math.min(0.04 * this.unitsPerMeter, extent * 0.16)
            this.controls.maxDistance = Math.max(2 * this.unitsPerMeter, extent * 4)
            this.controls.listenToKeyEvents(this.canvas)
        }
        if (target) this.controls.target.copy(target)
        this.controls.update()
        this.controls.addEventListener('change', () => this.experience.cameraChanged())
        this.experience.invalidate()
    }

    /** Look from a patient face while retaining the current orbit target and viewing distance. */
    alignToFace(normal, up)
    {
        const { instance, controls } = this
        const target = controls.target.clone()
        const distance = Math.max(instance.position.distanceTo(target), instance.near * 2)
        instance.position.copy(target).addScaledVector(normal, distance)
        instance.up.copy(up)
        instance.lookAt(target)
        this.setMode(this.mode, target, up)
    }

    setVolumeSize(size, unitsPerMeter)
    {
        this.size = size
        this.unitsPerMeter = unitsPerMeter
        const span = Math.max(size.z, Math.max(size.x, size.y) / Math.min(1, this.instance.aspect))
        this.instance.near = Math.min(0.001 * unitsPerMeter, span / 250)
        this.instance.far = Math.max(10 * unitsPerMeter, span * 8)
        this.instance.updateProjectionMatrix()
        return span
    }

    /** Keep the camera and target at the same scan-relative coordinates after a display scale change. */
    rescale(size, unitsPerMeter)
    {
        const ratio = size.clone().divide(this.size)
        const { instance, controls } = this
        const target = controls.target.clone().multiply(ratio)
        const direction = instance.getWorldDirection(new THREE.Vector3()).multiply(ratio)
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(instance.quaternion).multiply(ratio).normalize()
        const orbitUp = instance.up.clone().multiply(ratio).normalize()

        instance.position.multiply(ratio)
        instance.up.copy(up)
        instance.lookAt(instance.position.clone().add(direction))
        this.setVolumeSize(size, unitsPerMeter)
        this.setMode(this.mode, target, orbitUp)
    }

    reset(size = this.size, unitsPerMeter = this.unitsPerMeter)
    {
        const span = this.setVolumeSize(size, unitsPerMeter)
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
