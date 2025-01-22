import EventEmitter from './EventEmitter'

export default class Keyboard extends EventEmitter 
{
    constructor() 
    {
        super()

        // Store currently pressed keys
        this.pressedKeys = {}

        // Bind event handlers to the instance
        this.onKeyDown = this.onKeyDown.bind(this)
        this.onKeyUp = this.onKeyUp.bind(this)

        // Add event listeners for keyboard actions
        window.addEventListener('keydown', this.onKeyDown)
        window.addEventListener('keyup', this.onKeyUp)
    }

    onKeyDown(event) 
    {
        const key = event.key.toLowerCase() // Normalize key names

        if (!this.pressedKeys[key]) 
        {
            this.pressedKeys[key] = true

            // Emit the `keydown` event
            this.trigger('keydown', { key })
        }
    }

    onKeyUp(event) 
    {
        const key = event.key.toLowerCase() // Normalize key names
        
        if (this.pressedKeys[key]) 
        {
            delete this.pressedKeys[key]

            // Emit the `keyup` event
            this.trigger('keyup', { key })
        }
    }

    isKeyPressed(key) 
    {
        return !!this.pressedKeys[key.toLowerCase()]
    }

    destroy() 
    {
        // Remove event listeners
        window.removeEventListener('keydown', this.onKeyDown)
        window.removeEventListener('keyup', this.onKeyUp)

        // Nullify properties for cleanup
        this.pressedKeys = null

        console.log('Keyboard destroyed')
    }
}
