import EventEmitter from './EventEmitter'

export default class Sizes extends EventEmitter
{
    constructor(viewport)
    {
        super()
        this.viewport = viewport
        this.update()
        this.observer = new ResizeObserver(() => this.update())
        this.observer.observe(viewport)
        this.onWindowResize = () => this.update()
        window.addEventListener('resize', this.onWindowResize)
    }

    update()
    {
        const width = Math.max(1, this.viewport.clientWidth)
        const height = Math.max(1, this.viewport.clientHeight)
        const pixelRatio = Math.max(0.5, Math.min(window.devicePixelRatio || 1, 1, Math.sqrt(1500000 / (width * height))))
        if (width === this.width && height === this.height && pixelRatio === this.pixelRatio) return

        Object.assign(this, { width, height, pixelRatio })
        this.trigger('resize')
    }

    destroy()
    {
        this.observer.disconnect()
        window.removeEventListener('resize', this.onWindowResize)
    }
}
