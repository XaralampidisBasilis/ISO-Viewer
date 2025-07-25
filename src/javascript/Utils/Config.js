import EventEmitter from './EventEmitter'

/**
 * Configures
 * 
 * A utility class to manage global application state like interpolation methods,
 * skipping strategies, and debug/statistics toggles.
 */
export default class Config extends EventEmitter
{
    static InterpolationMethods = [
        'trilinear', 
        'tricubic', 
    ]
    static SkippingMethods = [
        'occupancyMap',
        'isotropicDistanceMap',
        'anisotropicDistanceMap',
        'extendedDistanceMap',
    ]

    constructor() 
    {
        super()

        // Default configuration values
        this.settings = 
        {
            blockSize: 4,
            downscaleFactor: 0.5,
            isosurfaceValue: 0.69,
            interpolationMethod: 'trilinear',
            skippingMethod: 'anisotropicDistanceMap',       
            skippingEnabled: true,
            debugEnabled: true,
            statsEnabled: true,
            discardingEnabled: true,
        }
    }

    set(key, value) 
    {
        if (key === 'InterpolationMethod' && !Config.InterpolationMethods.includes(value)) 
        {
            console.warn(`Invalid InterpolationMethod: "${value}"`)
            return
        }

        if (key === 'SkippingMethod' && !Config.SkippingMethods.includes(value))
        {
            console.warn(`Invalid SkippingMethod: "${value}"`)
            return
        }

        if (key in this.settings) 
        {
            const oldValue = this.settings[key]
            this.settings[key] = value

            this.trigger('change', 
            { 
                key, 
                oldValue, 
                newValue: value,
            })
        } 
        else 
        {
            console.warn(`Unknown config key: "${key}"`)
        }
    }

    get(key) 
    {
        return key in this.settings ? this.settings[key] : null
    }

    destroy() 
    {
        this.settings = null
        console.log('Config destroyed')
    }
}
