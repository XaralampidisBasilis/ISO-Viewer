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
        const uDistmap = this.material.uniforms.u_distance_map.value

        await tf.ready()
        await this.processor.computeIntensityMap()
        await this.processor.computeOccupancyMap(uRendering.iso_intensity, uDistmap.sub_division)
        this.processor.computes.intensityMap.tensor.dispose()

        await this.processor.computeDistanceMap(uDistmap.max_iterations)
        await this.processor.computeBoundingBox()
        this.processor.computes.occupancyMap.tensor.dispose()
    }

    async updateMaps()
    {
        // Material defines and uniforms
        const defines = this.material.defines
        const uVolume = this.material.uniforms.u_intensity_map.value
        const uDistmap = this.material.uniforms.u_distance_map.value
        const uTextures = this.material.uniforms.u_textures.value
      
        // Free GPU before computation
        uTextures.intensity_map.dispose()
        uTextures.distance_map.dispose()

        await this.computeMaps()

        // Compute parameters
        const computes = this.processor.computes
        const pDistanceMap =  computes.distanceMap.parameters
        const pBoundingBox = computes.boundingBox.parameters 

        // Update textures
        uTextures.distance_map = this.processor.generateTexture('distanceMap', THREE.RedFormat, THREE.UnsignedByteType)
        computes.distanceMap.tensor.dispose()

        uTextures.intensity_map = new THREE.Data3DTexture(this.processor.volume.data, ...this.processor.volume.parameters.dimensions)
        uTextures.intensity_map.format = THREE.RedFormat
        uTextures.intensity_map.type = THREE.FloatType
        uTextures.intensity_map.minFilter = THREE.LinearFilter
        uTextures.intensity_map.magFilter = THREE.LinearFilter
        uTextures.intensity_map.computeMipmaps = false
        uTextures.intensity_map.needsUpdate = true

        // Update uniforms
        uDistmap.max_distance = pDistanceMap.maxDistance
        uDistmap.sub_division = pDistanceMap.subDivision
        uDistmap.dimensions.copy(pDistanceMap.dimensions)
        uDistmap.spacing.copy(pDistanceMap.spacing)
        uDistmap.size.copy(pDistanceMap.size)
        uDistmap.inv_sub_division = pDistanceMap.invSubDivision
        uDistmap.inv_dimensions.copy(pDistanceMap.invDimensions)
        uDistmap.inv_spacing.copy(pDistanceMap.invSpacing)
        uDistmap.inv_size.copy(pDistanceMap.invSize)
        uVolume.min_position.copy(pBoundingBox.minPosition)
        uVolume.max_position.copy(pBoundingBox.maxPosition) 

        // Update defines
        defines.MAX_CELL_COUNT = pBoundingBox.maxCellCount
        defines.MAX_BLOCK_COUNT = pBoundingBox.maxBlockCount
        this.material.needsUpdate = true
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
        // parameters
        const pVolume = this.processor.volume.parameters
        const pDistanceMap =  this.processor.computes.distanceMap.parameters
        const pBoundingBox = this.processor.computes.boundingBox.parameters

        // uniforms
        const uVolume = this.material.uniforms.u_intensity_map.value
        const uDistmap = this.material.uniforms.u_distance_map.value
        const uTextures = this.material.uniforms.u_textures.value

        // volume
        uVolume.dimensions.copy(pVolume.dimensions)
        uVolume.spacing.copy(pVolume.spacing)
        uVolume.size.copy(pVolume.size)
        uVolume.min_position.copy(pBoundingBox.minPosition)
        uVolume.max_position.copy(pBoundingBox.maxPosition)
        uVolume.min_intensity = pVolume.minIntensity
        uVolume.max_intensity = pVolume.maxIntensity
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

        // defines
        this.material.defines.MAX_CELL_COUNT = pBoundingBox.maxCellCount
        this.material.defines.MAX_BLOCK_COUNT = pBoundingBox.maxBlockCount
        this.material.needsUpdate = true
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