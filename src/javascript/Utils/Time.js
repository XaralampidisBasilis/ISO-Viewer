import EventEmitter from './EventEmitter'

export default class Time extends EventEmitter
{
    constructor()
    {
        super()

        // Setup
        this.start = Date.now()
        this.current = this.start
        this.elapsed = 0
        this.delta = 16

        // Control for animation frame ID
        this.animationFrameId = null

        // Start the tick loop
        this.tick = this.tick.bind(this) // Bind the tick method
        this.animationFrameId = window.requestAnimationFrame(this.tick)
    }

    tick()
    {
        const currentTime = Date.now()
        this.delta = currentTime - this.current
        this.current = currentTime
        this.elapsed = this.current - this.start

        // Emit the `tick` event
        this.trigger('tick', {
            elapsed: this.elapsed,
            delta: this.delta
        })

        // Continue the loop
        this.animationFrameId = window.requestAnimationFrame(this.tick)

        // console.log('tick', this)
    }

    destroy()
    {
        // Cancel the animation frame loop
        if (this.animationFrameId !== null)
        {
            window.cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }

        // Nullify properties for cleanup
        this.start = null
        this.current = null
        this.elapsed = null
        this.delta = null

        console.log('Time destroyed')
    }
}
