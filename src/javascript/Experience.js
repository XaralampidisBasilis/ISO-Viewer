import * as THREE from 'three'
import Configs from './Utils/Configs'
import Sizes from './Utils/Sizes'
import Time from './Utils/Time'
import Mouse from './Utils/Mouse'
import Stats from './Utils/Stats'
import Camera from './Camera'
import Renderer from './Renderer'
import World from './World/World'
import Resources from './Utils/Resources'
import Computes from './Computes/Computes'
import GUI from './GUI'
import { DEFAULT_OPTIONS, getSourcesFromUrl } from './Config'

export default class Experience
{
    constructor(canvas, context, options = {})
    {
        // Merge provided options with defaults
        const mergedOptions = 
        {
            ...DEFAULT_OPTIONS,
            ...options,
        }
        
        // Options
        this.canvas = canvas
        this.context = context
        this.options = mergedOptions

        // Global access (optional - for debugging)
        window.experience = this

        // Setup
        this.configs = new Configs()
        this.sizes = new Sizes()
        this.time = new Time()
        this.mouse = new Mouse()
        this.scene = new THREE.Scene()
        this.camera = new Camera()
        this.renderer = new Renderer()
        this.resources = new Resources(this.options.sources)
        this.computes = new Computes()
        this.world = new World()
        this.stats = new Stats(true)
        this.gui = new GUI()

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

        // Resources ready event
        this.resources.on('ready', () =>
        {
            this.start()
        })

        // Config change event
        this.configs.on('change', (event) =>
        {
            this.change(event)
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

    async start()
    {
        await this.computes.start()
        this.world.start()
        this.gui.start()
    }

    async change(event)
    {
        await this.computes.change(event)
        this.world.change(event)
    }

    destroy()
    {
        this.sizes.off('resize')
        this.time.off('tick')
        this.configs.off('change')

        // destroy components
        this.configs?.destroy()
        this.sizes?.destroy()
        this.time?.destroy()
        this.mouse?.destroy()
        this.world?.destroy()
        this.camera?.destroy()
        this.renderer?.destroy()
        this.computes?.destroy()
        this.gui?.destroy()

        // Nullify properties for cleanup
        this.configs = null
        this.sizes = null
        this.time = null
        this.mouse = null
        this.scene = null
        this.camera = null
        this.resources = null
        this.renderer = null
        this.world = null
        this.stats = null
        this.computes = null
        this.canvas = null
        this.options = null

        console.log('Experience destroyed')
    }
}