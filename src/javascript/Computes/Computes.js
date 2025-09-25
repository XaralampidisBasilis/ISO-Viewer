import EventEmitter from '../Utils/EventEmitter'
import Experience from '../Experience'
import InterpolationMap from './Maps/InterpolationMap'
import ExtremaMap from './Maps/ExtremaMap'
import OccupancyMap from './Maps/OccupancyMap'
import IsotropicDistanceMap from './Maps/IsotropicDistanceMap'
import AnisotropicDistanceMap from './Maps/AnisotropicDistanceMap'
import ExtendedAnisotropicDistanceMap from './Maps/ExtendedAnisotropicDistanceMap'

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

        this.interpolationMap = new InterpolationMap()
        this.extremaMap = new ExtremaMap()
        this.occupancyMap = new OccupancyMap()
        this.isotropicDistanceMap = new IsotropicDistanceMap()
        this.anisotropicDistanceMap = new AnisotropicDistanceMap()
        this.extendedAnisotropicDistanceMap = new ExtendedAnisotropicDistanceMap()

        tf.enableProdMode() // or tf.enableDebugMode() 
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true) // halves bandwidth on many GPUs
        tf.env().set('WEBGL_PACK', true)               // ensure packing is on
        tf.env().set('WEBGL_CPU_FORWARD', false)       // be strict about staying on GPU
        tf.env().set('WEBGL_LAZILY_UNPACK', true)      // Optional: if you see shader compiles dominating, enable persisting programs
    }

    start()
    {
        this.interpolationMap.compute()
        this.extremaMap.compute()
        this.occupancyMap.compute()

        if (this.configs.skippingMethod === 'isotropicDistanceMap')
            this.isotropicDistanceMap.compute()

        if (this.configs.skippingMethod === 'anisotropicDistanceMap')
            this.anisotropicDistanceMap.compute()

        if (this.configs.skippingMethod === 'extendedAnisotropicDistanceMap')
            this.extendedAnisotropicDistanceMap.compute()
        
    }

    change(event)
    {
        if (event.key === 'isosurfaceValue') this.onChangeIsosurfaceValue(event)
        if (event.key === 'blockSize') this.onChangeBlockSize(event)
        if (event.key === 'interpolationMethod') this.onChangeInterpolationMethod(event)
        if (event.key === 'skippingMethod') this.onChangeSkippingMethod(event)
    }

    onChangeIsosurfaceValue(event)
    {
        this.occupancyMap.compute()

        if (event.newValue === 'isotropicDistanceMap')
            this.isotropicDistanceMap.compute()

        if (event.newValue === 'anisotropicDistanceMap')
            this.anisotropicDistanceMap.compute()

        if (event.newValue === 'extendedAnisotropicDistanceMap')
            this.extendedAnisotropicDistanceMap.compute()
    }

    onChangeBlockSize(event)
    {
        this.extremaMap.compute()
        this.occupancyMap.compute()

        if (this.configs.skippingMethod === 'isotropicDistanceMap')
            this.isotropicDistanceMap.compute()

        if (this.configs.skippingMethod === 'anisotropicDistanceMap')
            this.anisotropicDistanceMap.compute()
        
        if (this.configs.skippingMethod === 'extendedAnisotropicDistanceMap')
            this.extendedAnisotropicDistanceMap.compute()
        
    }

    onChangeInterpolationMethod(event)
    {
        this.extremaMap.compute()
        this.occupancyMap.compute()

        if (this.configs.skippingMethod === 'isotropicDistanceMap')
            this.isotropicDistanceMap.compute()

        if (this.configs.skippingMethod === 'anisotropicDistanceMap')
            this.anisotropicDistanceMap.compute()

        if (this.configs.skippingMethod === 'extendedAnisotropicDistanceMap')
            this.extendedAnisotropicDistanceMap.compute()
    }

    onChangeSkippingMethod(event)
    {
        if (event.oldValue === 'isotropicDistanceMap')
            this.isotropicDistanceMap.tensor.dispose()

        if (event.oldValue === 'anisotropicDistanceMap')
            this.anisotropicDistanceMap.tensor.dispose()

        if (event.oldValue === 'extendedAnisotropicDistanceMap')
            this.extendedAnisotropicDistanceMap.tensor.dispose()

        
        if (event.newValue === 'isotropicDistanceMap')
            this.isotropicDistanceMap.compute()

        if (event.newValue === 'anisotropicDistanceMap')
            this.anisotropicDistanceMap.compute()

        if (event.newValue === 'extendedAnisotropicDistanceMap')
            this.extendedAnisotropicDistanceMap.compute()
        
    }

}