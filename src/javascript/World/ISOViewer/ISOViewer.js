import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Experience from '../../Experience'
import EventEmitter from '../../Utils/EventEmitter'
import ISOMaterial from './ISOMaterial'
import ISOGui from './ISOGui'
import ISOProcessor from './ISOProcessor'

export default class ISOViewer extends EventEmitter
{
    constructor()
    {
        super()

        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.renderer = this.experience.renderer
        this.camera = this.experience.camera
        this.sizes = this.experience.sizes
        this.debug = this.experience.debug
        this.material = ISOMaterial()
        this.gui = new ISOGui(this)
        this.processor = new ISOProcessor(this.resources.items.volumeNifti)
        this.process().then(() => 
        {
            // this.setParameters()
            // this.setTextures()
            // this.setGeometry()
            // this.setMaterial()
            // this.setMesh()
            // this.trigger('ready')
        })
    }
    
    async process()
    {
        const uRendering = this.material.uniforms.u_rendering.value
        const uDistmap = this.material.uniforms.u_distmap.value

        await tf.ready()
        await this.processor.generateIntensityMap()
        await this.processor.normalizeIntensityMap()
        await this.processor.generateOccupancyMap(uRendering.threshold_value, uDistmap.sub_division)
        // await this.processor.generateDistanceMap(uRendering.threshold_value, uDistmap.sub_division, uDistmap.max_iterations)
        // await this.processor.generateBoundingBox(uRendering.threshold_value)
    }

    async updateBoundingBox()
    {
        const uRendering = this.material.uniforms.u_rendering.value
        const uVolume = this.material.uniforms.u_volume.value
        await this.processor.generateBoundingBox(uRendering.threshold_value)
        
        const pBoundingBox = this.processor.boundingBox.parameters 
        uVolume.min_position.copy(pBoundingBox.minPosition)
        uVolume.max_position.copy(pBoundingBox.maxPosition)     
    }   

    async updateDistanceMap()
    {
        const uRendering = this.material.uniforms.u_rendering.value
        const uDistmap = this.material.uniforms.u_distmap.value
        const uTextures = this.material.uniforms.u_textures.value
        await this.processor.generateDistanceMap(uRendering.threshold_value, uDistmap.sub_division, uDistmap.max_iterations)
        
        const pDistanceMap =  this.processor.isosurfaceDistanceDualMap.parameters
        uDistmap.max_distance = pDistanceMap.maxDistance
        uDistmap.sub_division = pDistanceMap.subDivision
        uDistmap.dimensions.copy(pDistanceMap.dimensions)
        uDistmap.spacing.copy(pDistanceMap.spacing)
        uDistmap.size.copy(pDistanceMap.size)
        uDistmap.inv_sub_division = pDistanceMap.invSubDivision
        uDistmap.inv_dimensions.copy(pDistanceMap.invDimensions)
        uDistmap.inv_spacing.copy(pDistanceMap.invSpacing)
        uDistmap.inv_size.copy(pDistanceMap.invSize)

        uTextures.distance_map.dispose()
        uTextures.distance_map = this.processor.generateTexture('distanceMap', THREE.RedFormat, THREE.UnsignedByteType)
        uTextures.distance_map.needsUpdate = true
        this.processor.distanceMap.tensor.dispose()

        console.log(pDistanceMap)
        console.log(uDistmap)

        this.logMemory('updateDistmap')
    }

    setParameters()
    {
        this.parameters = {}
        this.parameters.volume = { ...this.processor.volume.parameters}
    }

    setTextures()
    {
        this.textures = {}
        this.textures.intensityMap = this.processor.generateTexture('intensityMap', THREE.RedFormat, THREE.FloatType)
        this.textures.distanceMap = this.processor.generateTexture('distanceMap', THREE.RedFormat, THREE.UnsignedByteType)
        this.processor.distanceMap.tensor.dispose()

        this.textures.colorMaps = this.resources.items.colormaps                      
        this.textures.colorMaps.colorSpace = THREE.SRGBColorSpace
        this.textures.colorMaps.minFilter = THREE.LinearFilter
        this.textures.colorMaps.magFilter = THREE.LinearFilter         
        this.textures.colorMaps.generateMipmaps = false
        this.textures.colorMaps.needsUpdate = true 
    }
  
    setGeometry()
    {
        const size = this.parameters.volume.size
        const center = this.parameters.volume.size.clone().divideScalar(2)
        this.geometry = new THREE.BoxGeometry(...size)
        
        // In order to align model vertex coordinates with texture coordinates
        // we translate all with the center, so now they start at zero
        this.geometry.translate(...center) 
    }

    setMaterial()
    {        
        // parameters
        const pVolume = this.processor.volume.parameters
        const pIntensityMap = this.processor.intensityMap.parameters
        const pDistanceMap =  this.processor.distanceMap.parameters
        const pBoundingBox = this.processor.boundingBox.parameters

        // uniforms
        const uVolume = this.material.uniforms.u_volume.value
        const uDistmap = this.material.uniforms.u_distmap.value
        const uTextures = this.material.uniforms.u_textures.value

        // volume
        uVolume.dimensions.copy(pVolume.dimensions)
        uVolume.spacing.copy(pVolume.spacing)
        uVolume.size.copy(pVolume.size)
        uVolume.min_position.copy(pBoundingBox.minPosition)
        uVolume.max_position.copy(pBoundingBox.maxPosition)
        uVolume.min_intensity = pIntensityMap.minValue
        uVolume.max_intensity = pIntensityMap.maxValue
        uVolume.size_length = pVolume.sizeLength
        uVolume.spacing_length = pVolume.spacingLength
        uVolume.inv_dimensions.copy(pVolume.invDimensions)
        uVolume.inv_spacing.copy(pVolume.invSpacing)
        uVolume.inv_size.copy(pVolume.invSize)
 
        // distance map
        uDistmap.max_distance = pDistanceMap.maxDistance
        uDistmap.sub_division = pDistanceMap.subDivision
        uDistmap.dimensions.copy(pDistanceMap.dimensions)
        uDistmap.spacing.copy(pDistanceMap.spacing)
        uDistmap.size.copy(pDistanceMap.size)
        uDistmap.inv_sub_division = pDistanceMap.invSubDivision
        uDistmap.inv_dimensions.copy(pDistanceMap.invDimensions)
        uDistmap.inv_spacing.copy(pDistanceMap.invSpacing)
        uDistmap.inv_size.copy(pDistanceMap.invSize)

        // textures
        uTextures.intensity_map = this.textures.intensityMap
        uTextures.distance_map = this.textures.distanceMap
        uTextures.color_maps = this.textures.colorMaps   
    }

    setMesh()
    {   
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.copy(this.parameters.volume.size).multiplyScalar(-0.5)
        this.scene.add(this.mesh)
    }

    destroy() 
    {
        Object.keys(this.textures).forEach(key => 
        {
            if (this.textures[key]) 
                this.textures[key].dispose()
        })
    
        if (this.mesh) 
        {
            this.scene.remove(this.mesh)
            this.mesh.geometry.dispose()
            this.mesh.material.dispose()
        }
    
        // if (this.gui) 
        //     this.gui.destroy()

        if (this.processor)
            this.processor.destroy()

        // Clean up references
        this.scene = null
        this.resources = null
        this.renderer = null
        this.camera = null
        this.sizes = null
        this.debug = null
        this.mesh = null
        this.gui = null

        console.log("ISOViewer destroyed")
    }

    logMemory(fun)
    {
        console.log(`${fun}: Tensors = ${tf.memory().numTensors}, Textures = ${this.renderer.instance.info.memory.textures}`)
    }
    
}