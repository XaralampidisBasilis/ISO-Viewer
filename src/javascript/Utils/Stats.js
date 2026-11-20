import EventEmitter from './EventEmitter'

const sampleWindow = 350
const idleDelay = 320

export default class Stats extends EventEmitter
{
    constructor()
    {
        super()
        this.active = false
        this.reset()
    }

    setActive(active)
    {
        if (this.active === active) return
        this.active = active
        this.reset()
    }

    reset()
    {
        this.fps = null
        this.lastFrame = null
        this.sampleStart = null
        this.frames = 0
        this.trigger('change')
    }

    frame(now = performance.now())
    {
        this.lastFrame = now
        if (this.sampleStart === null)
        {
            this.sampleStart = now
            return
        }

        this.frames++
        const elapsed = now - this.sampleStart
        if (elapsed < sampleWindow) return

        const fps = Math.round(this.frames * 1000 / elapsed)
        this.sampleStart = now
        this.frames = 0
        if (fps === this.fps) return
        this.fps = fps
        this.trigger('change')
    }

    idle(now = performance.now())
    {
        if (this.lastFrame !== null && now - this.lastFrame >= idleDelay) this.reset()
    }

    destroy()
    {
        this.off('change')
    }
}
