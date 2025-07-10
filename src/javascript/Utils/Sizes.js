import EventEmitter from './EventEmitter'

/**
 * Sizes
 * 
 * A utility class to track and respond to changes in the browser window size.
 * Extends EventEmitter to notify subscribers when the window is resized.
 */
export default class Sizes extends EventEmitter 
{
    constructor() 
    {
        super()

        // Setup initial dimensions
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.pixelRatio = Math.min(window.devicePixelRatio, 1) // Cap pixel ratio at 1 for performance

        // Bind resize event
        this.onResize = this.onResize.bind(this)
        window.addEventListener('resize', this.onResize)
    }

    onResize() 
    {
        // Update dimensions
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.pixelRatio = Math.min(window.devicePixelRatio, 1)

        // Emit the `resize` event with updated values
        this.trigger('resize', 
        {
            width: this.width,
            height: this.height,
            pixelRatio: this.pixelRatio
        })
    }

    destroy() 
    {
        // Remove the resize event listener
        window.removeEventListener('resize', this.onResize)

        // Nullify properties for cleanup
        this.width = null
        this.height = null
        this.pixelRatio = null

        console.log('Sizes destroyed')
    }
}
