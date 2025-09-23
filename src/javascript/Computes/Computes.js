import EventEmitter from '../Utils/EventEmitter'
import Experience from '../Experience'

export default class Computes extends EventEmitter
{
    static instance = null

    constructor()
    {
        super()

        // singleton
        if (Computes.instance) 
        {
            return Computes.instance
        }
        Computes.instance = this

        this.experience = new Experience()
        this.configs = this.experience.configs
        this.resources = this.experience.resources
    }

    async setup()
    {
        await this.setTensorflow()

    }

    async setTensorflow()
    {
        console.time('setTensorflow')
        
        tf.enableProdMode()
        // tf.enableDebugMode() 

        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true) // halves bandwidth on many GPUs
        tf.env().set('WEBGL_PACK', true)               // ensure packing is on
        tf.env().set('WEBGL_CPU_FORWARD', false)       // be strict about staying on GPU
        tf.env().set('WEBGL_LAZILY_UNPACK', true)      // Optional: if you see shader compiles dominating, enable persisting programs
        
        await tf.setBackend('webgl')

        console.timeEnd('setTensorflow') 
    }

    async update()
    {

    }

    async onIsosurfaceValueChange()
    {

    }

    async onInterpolationMethodChange()
    {

    }

    async onSkippingMethodChange()
    {

    }

    async onSkippingCellsChange()
    {

    }

    async onDownscaleValueChange()
    {
        
    }
}