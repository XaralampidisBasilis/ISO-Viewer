import * as THREE from 'three'
import Config from './Utils/Config'
import Debug from './Utils/Debug'
import Sizes from './Utils/Sizes'
import Time from './Utils/Time'
import Mouse from './Utils/Mouse'
import Stats from './Utils/Stats'
import Camera from './Camera'
import Renderer from './Renderer'
import World from './World/World'
import Resources from './Utils/Resources'
import sources from './sources'

export default class Experience
{
    static instance = null

    constructor(canvas, context)
    {
        // singleton
        if (Experience.instance) 
        {
            return Experience.instance
        }
        Experience.instance = this
        
        // Global access
        window.experience = this

        // Options
        this.canvas = canvas
        this.context = context

        // Setup
        this.config = new Config()
        this.debug = new Debug()
        this.sizes = new Sizes()
        this.time = new Time()
        this.mouse = new Mouse()
        this.scene = new THREE.Scene()
        this.camera = new Camera()
        this.resources = new Resources(sources)
        this.renderer = new Renderer()
        this.world = new World()
        this.stats = new Stats(true)

        // Size resize event
        this.sizes.on('resize', () => 
        {
            this.resize()
        })

        // Time tick event
        this.time.on('tick', () => 
        {
            this.update()
        })

        // Config change event
        this.config.on('change', () =>
        {
            this.change()
        })

        // Resources ready event
        this.resources.on('ready', () =>
        {
            
        })

        // Window refresh event
        window.addEventListener('beforeunload', () => 
        {
            this.destroy()
        })
    }

    resize()
    {
        this.camera.resize()
        this.renderer.resize()
    }

    update()
    {
        this.camera.update()
        this.stats.update()    
        this.renderer.update()
    }

    change()
    {

    }

    destroy()
    {
        this.sizes.off('resize')
        this.time.off('tick')
        this.config.off('change')

        // destroy components
        if (this.config) 
            this.config.destroy()

        if (this.debug)
            this.debug.destroy()

        if (this.sizes) 
            this.sizes.destroy()

        if (this.time) 
            this.time.destroy()

        if (this.mouse) 
            this.mouse.destroy()

        if (this.world) 
            this.world.destroy()

        if (this.camera)
            this.camera.destroy()

        if (this.renderer) 
            this.renderer.destroy()


        // Nullify properties for cleanup
        this.config = null
        this.debug = null
        this.sizes = null
        this.time = null
        this.mouse = null
        this.scene = null
        this.camera = null
        this.resources = null
        this.renderer = null
        this.world = null
        this.stats = null
        this.canvas = null

        // Clear the singleton instance
        instance = null

        console.log('Experience destroyed')
    }
}