import * as THREE from 'three'
import Configs from './Utils/Configs'
import Sizes from './Utils/Sizes'
import Time from './Utils/Time'
import Stats from './Utils/Stats'
import Camera from './Camera'
import Renderer from './Renderer'
import World from './World/World'
import Resources from './Utils/Resources'
import Computes from './Computes/Computes'
import sources, { intensityRange } from './sources'
import { setTensorflow } from './tensorflow'

export default class Experience
{
    static instance = null

    constructor(canvas, context, gui)
    {
        if (Experience.instance) return Experience.instance
        Experience.instance = this
        window.experience = this

        this.canvas = canvas
        this.context = context
        this.gui = gui
        this.abort = new AbortController()
        this.dirty = true
        this.ready = false
        this.loading = false
        this.pending = new Map()
        this.maxTextureSize = context.getParameter(context.MAX_3D_TEXTURE_SIZE)

        const viewport = canvas.parentElement
        this.configs = new Configs()
        this.sizes = new Sizes(viewport)
        this.scene = new THREE.Scene()
        this.camera = new Camera()
        this.renderer = new Renderer()
        this.resources = new Resources()
        this.computes = new Computes()
        this.world = new World()
        this.stats = new Stats(false, viewport)
        this.time = new Time()

        this.sizes.on('resize', () => {
            this.camera.resize()
            this.renderer.resize()
            this.invalidate()
        })
        this.time.on('tick', () => this.update())
        this.configs.on('change', event => {
            const previous = this.pending.get(event.key)
            this.pending.set(event.key, previous ?? event.oldValue)
        })
        const signal = this.abort.signal
        canvas.addEventListener('webglcontextlost', event => {
            event.preventDefault()
            this.ready = false
            this.contextLost = true
            this.stats.deactivate()
            this.gui.fail(new Error('The browser lost the graphics context. Reload to restart the viewer.'), true)
        }, { signal })
        document.addEventListener('visibilitychange', () => this.invalidate(), { signal })
        window.addEventListener('pagehide', event => {
            if (!event.persisted) this.destroy()
        }, { signal })

        gui.connect(this)
    }

    invalidate()
    {
        this.dirty = true
    }

    cameraChanged()
    {
        if (!this.ready) return
        this.renderer.setInteractionScale(0.72)
        clearTimeout(this.settleTimer)
        this.settleTimer = setTimeout(() => {
            this.renderer.setInteractionScale(1)
            this.invalidate()
        }, 160)
        this.invalidate()
    }

    update()
    {
        if (document.hidden || this.contextLost) return
        this.camera.update()
        if (!this.ready) return

        if (this.pending.size && !this.loading && !this.applying) this.applySettings()
        if (!this.dirty && !this.stats.active) return

        this.dirty = false
        this.renderer.update()
        this.stats.update()
    }

    validateGrid(volume, factor, blockSize, skippingMethod)
    {
        const dimensions = volume.dimensions.map(size => Math.ceil(size * factor))
        if (Math.max(...dimensions) > this.maxTextureSize)
            throw new Error('This graphics device cannot fit the selected volume detail.')

        const octantDepth = Math.ceil((dimensions[2] + 1) / blockSize) * 8
        if (octantDepth > this.maxTextureSize &&
            (skippingMethod === 'anisotropicDistance' || skippingMethod === 'extendedAnisotropicDistance'))
            throw new Error('Select isotropic distance or block occupancy to fit this GPU’s texture limit.')
    }

    async loadQuality(quality = 'preview')
    {
        const source = sources[quality]
        if (!source || this.loading || this.applying || this.quality === quality || this.contextLost) return

        const initial = !this.ready
        const signal = this.abort.signal
        this.loading = true
        this.gui.busy(true)
        const download = quality === 'detail' ? 'Downloading the high-detail scan' : 'Downloading the CTA preview'
        this.gui.setProgress(initial, download)

        try
        {
            this.backend ??= setTensorflow()
            const [volume] = await Promise.all([
                this.resources.loadVolume(source.path, (loaded, total) => this.gui.setProgress(initial, download, loaded, total), signal),
                this.backend,
            ])

            if (initial && Math.ceil((volume.dimensions[2] + 1) / this.configs.blockSize) * 8 > this.maxTextureSize)
                this.configs.skippingMethod = 'isotropicDistance'
            this.validateGrid(volume, source.factor, this.configs.blockSize, this.configs.skippingMethod)
            await this.computes.rebuild(volume, source.factor, intensityRange, label => this.gui.setProgress(initial, label), signal)
            if (this.contextLost) return

            this.configs.downscaleFactor = source.factor
            this.quality = quality
            if (initial)
            {
                this.world.start()
                this.camera.reset(this.world.viewer.size)
            }
            else this.world.change()

            this.renderer.update()
            this.ready = true
            this.gui.ready(quality)
        }
        catch (error)
        {
            if (!signal.aborted && !this.contextLost)
            {
                console.error(error)
                this.gui.fail(error, initial)
            }
        }
        finally
        {
            this.loading = false
        }
    }

    async applySettings()
    {
        const changes = this.pending
        this.pending = new Map()
        for (const [key, value] of changes)
            if (this.configs[key] === value) changes.delete(key)
        if (!changes.size)
        {
            this.gui.sync()
            return
        }

        this.applying = true
        const signal = this.abort.signal

        try
        {
            const configs = this.configs
            const volume = this.computes.volume
            this.validateGrid(volume, configs.downscaleFactor, configs.blockSize, configs.skippingMethod)

            if (changes.has('blockSize') || changes.has('downscaleFactor'))
            {
                this.gui.busy(true)
                await this.computes.rebuild(volume, configs.downscaleFactor, intensityRange, label => this.gui.setProgress(false, label), signal)
                this.gui.ready(this.quality)
            }
            else
            {
                const rethreshold = changes.has('isosurfaceValue') || changes.has('interpolationMethod')
                if (rethreshold || changes.has('skippingMethod')) this.computes.updateAcceleration(rethreshold)
            }

            if (this.contextLost || signal.aborted) return
            this.world.change()
            this.gui.sync()
            this.invalidate()
        }
        catch (error)
        {
            if (!signal.aborted && !this.contextLost)
            {
                for (const [key, value] of changes) this.configs[key] = value
                console.error(error)
                this.gui.fail(error, false)
            }
        }
        finally
        {
            this.applying = false
        }
    }

    destroy()
    {
        this.abort.abort()
        clearTimeout(this.settleTimer)
        this.time.destroy()
        this.sizes.destroy()
        this.camera.destroy()
        this.world.destroy()
        this.computes.destroy()
        this.renderer.destroy()
        this.gui.destroy()
        this.stats.destroy()
        Experience.instance = null
        if (window.experience === this) delete window.experience
    }
}
