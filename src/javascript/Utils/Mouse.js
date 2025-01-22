import EventEmitter from './EventEmitter'

export default class Mouse extends EventEmitter
{
    constructor()
    {
        super()

        // Initial mouse position
        this.x = 0
        this.y = 0

        // Normalized mouse position (-1 to 1 range)
        this.normalizedX = 0
        this.normalizedY = 0

        // Bind event handlers to the instance
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseDown = this.onMouseDown.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)

        // Add event listeners
        window.addEventListener('mousemove', this.onMouseMove)
        window.addEventListener('mousedown', this.onMouseDown)
        window.addEventListener('mouseup', this.onMouseUp)
    }

    onMouseMove(event)
    {
        // Update mouse position
        this.x = event.clientX
        this.y = event.clientY

        // Update normalized mouse position
        this.normalizedX = this.x / window.innerWidth
        this.normalizedY = -this.y / window.innerHeight

        // Emit the `move` event
        this.trigger('move', {
            x: this.x,
            y: this.y,
            normalizedX: this.normalizedX,
            normalizedY: this.normalizedY
        })

        // console.log('mousemove', this)
    }

    onMouseDown(event)
    {
        // Emit the `down` event with button information
        this.trigger('down', {
            button: event.button,
            x: this.x,
            y: this.y
        })

        // console.log('mousedown', this)
    }

    onMouseUp(event)
    {
        // Emit the `up` event with button information
        this.trigger('up', {
            button: event.button,
            x: this.x,
            y: this.y
        })

        // console.log('mouseup', this)
    }

    destroy() 
    {
        // Remove event listeners
        window.removeEventListener('mousemove', this.onMouseMove)
        window.removeEventListener('mousedown', this.onMouseDown)
        window.removeEventListener('mouseup', this.onMouseUp)

        // Clear properties for cleanup
        this.x = null
        this.y = null
        this.normalizedX = null
        this.normalizedY = null

        console.log('Mouse destroyed')
    }
}
