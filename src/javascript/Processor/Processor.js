import EventEmitter from '../Utils/EventEmitter'
import Experience from '../Experience'
import Computes from './Computes'
import Textures from './Textures'

export default class Processor extends EventEmitter
{
    constructor()
    {
        super()

        this.experience = new Experience()
        this.settings = this.experience.config.settings
        this.resources = this.experience.resources

        this.computes = new Computes()
        this.textures = new Textures()
    }

    async setup()
    {
        await this.computes.setTensorflow()
        await this.processInterpolation()
        await this.processSkipping()
    }

    async processInterpolation()
    {
        if (this.settings.interpolationMethod === 'trilinear')
        {
            await this.computes.computeVolumeMap()
            await this.computes.normalizeVolumeMap()
            await this.computes.computeTrilinearExtremaMap()
            this.computes.volumeMap.tensor.dispose()

            await this.textures.textureVolumeMap()
        }

        if (this.settings.interpolationMethod === 'tricubic')
        {
            await this.computes.computeVolumeMap()
            await this.computes.downscaleVolumeMap()
            await this.computes.normalizeVolumeMap()
            await this.computes.computeTricubicVolumeMap()
            await this.computes.computeTricubicExtremaMap()
            this.computes.volumeMap.tensor.dispose()

            await this.textures.textureTricubicVolumeMap()
        }
    }

    async processSkipping()
    {
        if (this.settings.skippingEnabled)
        {
            if (this.settings.skippingMethod === 'occupancyMap')
            {
                await this.computes.computeOccupancyMap()
            }
    
            if (this.settings.skippingMethod === 'isotropicDistanceMap')
            {
                await this.computes.computeOccupancyMap()
                await this.computes.computeIsotropicDistanceMap()
                this.computes.occupancyMap.tensor.dispose()
            }

            if (this.settings.skippingMethod === 'anisotropicDistanceMap')
            {
                await this.computes.computeOccupancyMap()
                await this.computes.computeAnisotropicDistanceMap()
                this.computes.occupancyMap.tensor.dispose()
            }

            if (this.settings.skippingMethod === 'extendedDistanceMap')
            {
                await this.computes.computeOccupancyMap()
                await this.computes.computeExtendedDistanceMap()
                this.computes.occupancyMap.tensor.dispose()
            }   
        }
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