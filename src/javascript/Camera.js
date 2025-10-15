import * as THREE from 'three'
import Experience from './Experience'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { FlyControls } from 'three/examples/jsm/controls/FlyControls'
import { ProbeControls } from './Utils/ProbeControls'

export default class Camera
{
    constructor()
    {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.time = this.experience.time

        this.setInstance()
        // this.setTrackballControls()
        // this.setFlyControls()
        this.setProbeControls()
    }

    setInstance()
    {
        this.instance = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height, 0.001, 100)
        this.instance.position.set(1, 1, 1)
        this.scene.add(this.instance)
    }

    setOrbitControls()
    {
        this.orbit = new OrbitControls(this.instance, this.canvas)
        this.orbit.enableDamping = true
        this.orbit.enableZoom = true
        this.orbit.zoomToCursor = true
        this.orbit.zoomSpeed = 2
    }

    setTrackballControls()
    {
        this.trackball = new TrackballControls(this.instance, this.canvas)
        this.trackball.staticMoving = false
        this.trackball.dynamicDampingFactor = 0.3
        this.trackball.zoomSpeed = 2.0
        this.trackball.panSpeed = 0.05
        this.trackball.rotateSpeed = 1.0
        this.trackball.enabled = true   
    }

    setFlyControls()
    {
        this.fly = new FlyControls(this.instance, this.canvas) 
        this.fly.movementSpeed = 0.5       
        this.fly.rollSpeed = Math.PI / 8   
        this.fly.dragToLook = true         
        this.fly.autoForward = false
        this.fly.enabled = true
    }

    setProbeControls()
    {
        this.probe = new ProbeControls(this.instance, this.canvas)
    }

    setRaycaster()
    {
        this.raycaster = new THREE.Raycaster()
        this.raycaster.setFromCamera(this.mouse.ndcPosition, this.instance)
    }

    resize()
    {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update()
    {
        if (this.orbit)
            this.orbit.update()

        if (this.trackball)
            this.trackball.update()

        if (this.fly) 
            this.fly.update()

        if (this.probe) 
            this.probe.update()

        if (this.raycaster)
            this.raycaster.setFromCamera(this.mouse.ndcPosition, this.instance)
    }

    destroy() 
    {
        this.scene.remove(this.instance)

        if (this.orbit) 
        {
            this.orbit.dispose()
            this.orbit = null
        }

        if (this.trackball) 
        {
            this.trackball.dispose()
            this.trackball = null
        }

        if (this.raycaster)
        {
            this.raycaster = null
        }

        if (this.instance) 
        {
            this.instance = null
        }

        this.experience = null
        this.sizes = null
        this.scene = null
        this.canvas = null

        console.log('Camera destroyed')
    }
}


