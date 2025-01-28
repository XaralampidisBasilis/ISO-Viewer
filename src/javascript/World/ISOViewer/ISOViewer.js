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

        this.computeMaps().then(() => 
        {
            this.setParameters()
            this.setTextures()
            this.setGeometry()
            this.setMaterial()
            this.setMesh()
            this.trigger('ready')
        })
    }
    
    async computeMaps()
    {
        const uRendering = this.material.uniforms.u_rendering.value
        const uDistanceMap = this.material.uniforms.u_distance_map.value

        await tf.ready()
        await this.processor.computeIntensityMap()
        await this.processor.computeOccupancyMap(uRendering.iso_intensity, uDistanceMap.sub_division)
        this.processor.computes.intensityMap.tensor.dispose()

        await this.processor.computeDistanceMap(uDistanceMap.max_iterations)
        await this.processor.computeBoundingBox()
        this.processor.computes.occupancyMap.tensor.dispose()
    }

    setParameters()
    {
        this.parameters = {}
        this.parameters.volume = { ...this.processor.volume.parameters}
    }

    setTextures()
    {
        this.textures = {}
    
        this.textures.intensityMap = new THREE.Data3DTexture(this.processor.volume.data, ...this.processor.volume.parameters.dimensions)
        this.textures.intensityMap.format = THREE.RedFormat
        this.textures.intensityMap.type = THREE.FloatType
        this.textures.intensityMap.minFilter = THREE.LinearFilter
        this.textures.intensityMap.magFilter = THREE.LinearFilter
        this.textures.intensityMap.computeMipmaps = false
        this.textures.intensityMap.needsUpdate = true

        this.textures.colorMaps = this.resources.items.colormaps                      
        this.textures.colorMaps.colorSpace = THREE.SRGBColorSpace
        this.textures.colorMaps.minFilter = THREE.LinearFilter
        this.textures.colorMaps.magFilter = THREE.LinearFilter         
        this.textures.colorMaps.generateMipmaps = false
        this.textures.colorMaps.needsUpdate = true 

        this.textures.distanceMap = this.processor.generateTexture('distanceMap', THREE.RedFormat, THREE.UnsignedByteType)
        this.processor.computes.distanceMap.tensor.dispose()
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
        // Compute Parameters
        const pVolume = this.processor.volume.parameters
        const pDistanceMap =  this.processor.computes.distanceMap.parameters
        const pBoundingBox = this.processor.computes.boundingBox.parameters

        // Material Uniforms
        const uTextures = this.material.uniforms.u_textures.value
        const uIntensityMap = this.material.uniforms.u_intensity_map.value
        const uDistanceMap = this.material.uniforms.u_distance_map.value

        // Update textures
        uTextures.intensity_map = this.textures.intensityMap
        uTextures.distance_map = this.textures.distanceMap
        uTextures.color_maps = this.textures.colorMaps   

        // Update uniforms
        uIntensityMap.dimensions.copy(pVolume.dimensions)
        uIntensityMap.spacing.copy(pVolume.spacing)
        uIntensityMap.size.copy(pVolume.size)
        uIntensityMap.min_position.copy(pBoundingBox.minPosition)
        uIntensityMap.max_position.copy(pBoundingBox.maxPosition)
        uIntensityMap.min_intensity = pVolume.minIntensity
        uIntensityMap.max_intensity = pVolume.maxIntensity
        uIntensityMap.size_length = pVolume.sizeLength
        uIntensityMap.spacing_length = pVolume.spacingLength
        uIntensityMap.inv_dimensions.copy(pVolume.invDimensions)
        uIntensityMap.inv_spacing.copy(pVolume.invSpacing)
        uIntensityMap.inv_size.copy(pVolume.invSize)
 
        uDistanceMap.max_distance = pDistanceMap.maxDistance
        uDistanceMap.sub_division = pDistanceMap.subDivision
        uDistanceMap.dimensions.copy(pDistanceMap.dimensions)
        uDistanceMap.spacing.copy(pDistanceMap.spacing)
        uDistanceMap.size.copy(pDistanceMap.size)
        uDistanceMap.inv_sub_division = pDistanceMap.invSubDivision
        uDistanceMap.inv_dimensions.copy(pDistanceMap.invDimensions)
        uDistanceMap.inv_spacing.copy(pDistanceMap.invSpacing)
        uDistanceMap.inv_size.copy(pDistanceMap.invSize)

        // Update defines
        const defines = this.material.defines
        defines.MAX_CELL_COUNT = pBoundingBox.maxCellCount
        defines.MAX_BLOCK_COUNT = pBoundingBox.maxBlockCount
        defines.MAX_CELL_SUB_COUNT = 3 * pDistanceMap.subDivision - 2
        defines.MAX_BLOCK_SUB_COUNT = Math.ceil(defines.MAX_BLOCK_COUNT / defines.MAX_BATCH_COUNT)
        console.log(defines)

        // Update material
        this.material.needsUpdate = true
    }

    setMesh()
    {   
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.copy(this.parameters.volume.size).multiplyScalar(-0.5)
        this.scene.add(this.mesh)
    }

    async update()
    {
        // Material defines and uniforms
        const uIntensityMap = this.material.uniforms.u_intensity_map.value
        const uDistanceMap = this.material.uniforms.u_distance_map.value
        const uTextures = this.material.uniforms.u_textures.value
      
        // Free GPU before computation
        uTextures.distance_map.dispose()

        await this.computeMaps()

        // Compute parameters
        const computes = this.processor.computes
        const pDistanceMap = computes.distanceMap.parameters
        const pBoundingBox = computes.boundingBox.parameters 

        // Update textures
        uTextures.distance_map = this.processor.generateTexture('distanceMap', THREE.RedFormat, THREE.UnsignedByteType)
        computes.distanceMap.tensor.dispose()

        // Update uniforms
        uDistanceMap.max_distance = pDistanceMap.maxDistance
        uDistanceMap.sub_division = pDistanceMap.subDivision
        uDistanceMap.dimensions.copy(pDistanceMap.dimensions)
        uDistanceMap.spacing.copy(pDistanceMap.spacing)
        uDistanceMap.size.copy(pDistanceMap.size)
        uDistanceMap.inv_sub_division = pDistanceMap.invSubDivision
        uDistanceMap.inv_dimensions.copy(pDistanceMap.invDimensions)
        uDistanceMap.inv_spacing.copy(pDistanceMap.invSpacing)
        uDistanceMap.inv_size.copy(pDistanceMap.invSize)
        uIntensityMap.min_position.copy(pBoundingBox.minPosition)
        uIntensityMap.max_position.copy(pBoundingBox.maxPosition) 

        // Update defines
        const defines = this.material.defines
        defines.MAX_CELL_COUNT = pBoundingBox.maxCellCount
        defines.MAX_BLOCK_COUNT = pBoundingBox.maxBlockCount
        defines.MAX_CELL_SUB_COUNT = 3 * pDistanceMap.subDivision - 2
        defines.MAX_BLOCK_SUB_COUNT = Math.ceil(defines.MAX_BLOCK_COUNT / defines.MAX_BATCH_COUNT)
        console.log(defines)

        // Update material
        this.material.needsUpdate = true
    }

    destroy() 
    {
        Object.keys(this.textures).forEach(key => 
        {
            if (this.textures[key]) 
            {
                this.textures[key].dispose()
            }
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
        {
            this.processor.destroy()
            this.processor = null
        }

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

    logGPU()
    {
        console.log(`$Tensors = ${tf.memory().numTensors}, Textures = ${this.renderer.instance.info.memory.textures}`)
    }
    
}