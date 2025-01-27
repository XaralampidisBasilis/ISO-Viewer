import * as THREE from 'three'
import Experience from './Experience'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

export default class Camera
{
    constructor()
    {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas

        this.setInstance()
        this.setControls()
    }

    setInstance()
    {
        this.instance = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height, 0.1, 2000)
        this.instance.position.set(6, 4, 8)
        this.scene.add(this.instance)
    }

    setControls()
    {
        this.controls = {}

        // this.controls.orbit = new OrbitControls(this.instance, this.canvas)
        // this.controls.orbit.enableDamping = true
        // this.controls.orbit.enableZoom = true
        // this.controls.orbit.zoomToCursor = true
        // this.controls.orbit.zoomSpeed = 2

        this.controls.trackball = new TrackballControls(this.instance, this.canvas)
        this.controls.trackball.staticMoving = false
        this.controls.trackball.zoomSpeed = 2
    }

    resize()
    {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update()
    {
        this.controls.trackball.update()
    }

    destroy() 
    {
        this.scene.remove(this.instance);

        if (this.controls.trackball) 
        {
            this.controls.trackball.dispose()
            this.controls = null // prevent memory leaks
        }

        if (this.instance) 
        {
            this.instance = null // allow garbage collection
        }

        this.experience = null
        this.sizes = null
        this.scene = null
        this.canvas = null

        console.log('Camera destroyed')
    }
}