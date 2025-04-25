import { cos } from 'mathjs'
import EventEmitter from './EventEmitter'

export default class Sizes extends EventEmitter 
{
    constructor() 
    {
        super()

        // Setup
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.pixelRatio = Math.min(window.devicePixelRatio, 1)

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

        // Emit the `resize` event
        this.trigger('resize', {
            width: this.width,
            height: this.height,
            pixelRatio: this.pixelRatio
        })

        // console.log('resize', this)
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
