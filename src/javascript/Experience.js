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

// Keep the rendered local grid within the tested high-detail CTA voxel budget.
const localVoxelBudget = 410 * 410 * 236

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
        this.stats = new Stats()
        this.time = new Time()

        this.sizes.on('resize', () =>
        {
            this.camera.resize()
            this.renderer.resize()
            this.invalidate()
        })
        this.time.on('tick', () => this.update())
        this.configs.on('change', event =>
        {
            const previous = this.pending.get(event.key)
            this.pending.set(event.key, previous ?? event.oldValue)
        })
        const signal = this.abort.signal
        canvas.addEventListener('webglcontextlost', event =>
        {
            event.preventDefault()
            this.ready = false
            this.contextLost = true
            if (this.stats.active) this.stats.setActive(false)
            else this.stats.reset()
            this.gui.fail(new Error('The browser lost the graphics context. Reload to restart the viewer.'), true)
        }, { signal })
        document.addEventListener('visibilitychange', () =>
        {
            this.stats.reset()
            this.invalidate()
        }, { signal })
        window.addEventListener('pagehide', event =>
        {
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
        this.settleTimer = setTimeout(() =>
        {
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
        const canMeasure = !this.loading && !this.applying
        if (!this.dirty && !(canMeasure && this.stats.active))
        {
            if (canMeasure) this.stats.idle()
            return
        }

        this.dirty = false
        this.renderer.update()
        if (canMeasure) this.stats.frame()
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

    loadQuality(quality = 'preview')
    {
        const source = sources[quality]
        if (!source || this.quality === quality) return
        return this.loadScan(quality, source)
    }

    loadLocal(file)
    {
        return this.loadScan('local', null, file)
    }

    async loadScan(quality, source, file)
    {
        if (this.loading || this.applying || this.contextLost) return

        const initial = !this.ready
        const reframe = initial || file || this.quality === 'local'
        const signal = this.abort.signal
        const previousSkippingMethod = this.configs.skippingMethod
        this.loading = true
        this.stats.reset()
        this.gui.busy(true)
        const loadingLabel = file ? 'Reading the local scan' : quality === 'detail'
            ? 'Downloading the high-detail scan' : 'Downloading the CTA preview'
        if (initial && file) this.gui.startLocalLoad()
        const progress = (loaded, total) => this.gui.setProgress(initial, loadingLabel, loaded, total)
        progress()

        try
        {
            this.backend ??= setTensorflow()
            const data = file
                ? this.resources.loadFile(file, progress, signal)
                : this.resources.loadVolume(source.path, progress, signal)
            const [volume] = await Promise.all([
                data,
                this.backend,
            ])

            const voxelCount = volume.dimensions.reduce((count, size) => count * size, 1)
            const factor = source?.factor ?? Math.min(1, Math.cbrt(localVoxelBudget / voxelCount),
                this.maxTextureSize / Math.max(...volume.dimensions))
            const range = file ? undefined : intensityRange
            const octantDepth = Math.ceil((Math.ceil(volume.dimensions[2] * factor) + 1) / this.configs.blockSize) * 8
            if (reframe && octantDepth > this.maxTextureSize &&
                (previousSkippingMethod === 'anisotropicDistance' || previousSkippingMethod === 'extendedAnisotropicDistance'))
                this.configs.skippingMethod = 'isotropicDistance'

            this.validateGrid(volume, factor, this.configs.blockSize, this.configs.skippingMethod)
            await this.computes.rebuild(volume, factor, range, label => this.gui.setProgress(initial, label), signal)
            if (this.contextLost || signal.aborted) return

            this.configs.downscaleFactor = factor
            this.quality = quality
            this.scanName = file?.name
            this.intensityRange = range
            if (initial) this.world.start()
            else this.world.change()
            if (reframe) this.camera.reset(this.world.viewer.size)

            this.renderer.update()
            this.ready = true
            this.gui.ready(quality)
        }
        catch (error)
        {
            this.configs.skippingMethod = previousSkippingMethod
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

            if (changes.has('blockSize') || changes.has('downscaleFactor') || changes.has('unpackedPreprocessing'))
            {
                this.stats.reset()
                this.gui.busy(true)
                await this.computes.rebuild(volume, configs.downscaleFactor, this.intensityRange, label => this.gui.setProgress(false, label), signal)
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
