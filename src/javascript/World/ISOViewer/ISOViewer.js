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
        this.processor.on('ready', () =>
        {
            this.generateMaps().then(() => this.setViewer())
        })
    }
    
    async generateMaps()
    {
        const uRendering = this.material.uniforms.u_rendering.value
        const uDistanceMap = this.material.uniforms.u_distance_map.value
        await this.processor.generateIntensityMap()
        await this.processor.generateOccupancyMap(uRendering.intensity, uDistanceMap.sub_division)
        await this.processor.generateDistanceMap(uDistanceMap.max_iterations)
        await this.processor.generateBoundingBox()
        tf.dispose(this.processor.computes.occupancyMap.tensor)
    }

    setViewer()
    {
        this.setParameters()
        this.setTextures()
        this.setGeometry()
        this.setMaterial()
        this.setMesh()
        this.trigger('ready')
    }

    setParameters()
    {
        this.parameters = {}
        this.parameters.volume = { ...this.processor.volume.parameters}
    }

    setTextures()
    {
        this.textures = {}

        // color maps
        this.textures.colorMaps = this.resources.items.colormaps                      
        this.textures.colorMaps.colorSpace = THREE.SRGBColorSpace
        this.textures.colorMaps.minFilter = THREE.LinearFilter
        this.textures.colorMaps.magFilter = THREE.LinearFilter         
        this.textures.colorMaps.generateMipmaps = false
        this.textures.colorMaps.needsUpdate = true 
        
        // distance map
        this.textures.distanceMap = new THREE.Data3DTexture(
            new Uint8Array(this.processor.computes.distanceMap.tensor.dataSync()), 
            ...this.processor.computes.distanceMap.parameters.dimensions
        )
        this.textures.distanceMap.format = THREE.RedFormat
        this.textures.distanceMap.type = THREE.UnsignedByteType
        this.textures.distanceMap.minFilter = THREE.LinearFilter
        this.textures.distanceMap.magFilter = THREE.LinearFilter
        this.textures.distanceMap.computeMipmaps = false
        this.textures.distanceMap.needsUpdate = true
        tf.dispose(this.processor.computes.distanceMap.tensor)

        // intensity map
        this.textures.intensityMap = new THREE.Data3DTexture(
            this.processor.volume.data, 
            ...this.processor.volume.parameters.dimensions
        )
        this.textures.intensityMap.format = THREE.RedFormat
        this.textures.intensityMap.type = THREE.FloatType
        this.textures.intensityMap.minFilter = THREE.LinearFilter
        this.textures.intensityMap.magFilter = THREE.LinearFilter
        this.textures.intensityMap.computeMipmaps = false
        this.textures.intensityMap.needsUpdate = true
        delete this.processor.volume.data
        delete this.resources.items.volumeNifti.data
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
        // Computes
        const intensityMap = this.processor.computes.intensityMap
        const distanceMap =  this.processor.computes.distanceMap
        const boundingBox = this.processor.computes.boundingBox

        // Uniforms/Defines
        const uTextures = this.material.uniforms.u_textures.value
        const uIntensityMap = this.material.uniforms.u_intensity_map.value
        const uDistanceMap = this.material.uniforms.u_distance_map.value
        const defines = this.material.defines

        // Update Uniforms
        uTextures.intensity_map = this.textures.intensityMap
        uTextures.distance_map = this.textures.distanceMap
        uTextures.color_maps = this.textures.colorMaps   

        uIntensityMap.dimensions.copy(intensityMap.parameters.dimensions)
        uIntensityMap.spacing.copy(intensityMap.parameters.spacing)
        uIntensityMap.size.copy(intensityMap.parameters.size)
        uIntensityMap.min_position.copy(boundingBox.parameters.minPosition)
        uIntensityMap.max_position.copy(boundingBox.parameters.maxPosition)
        uIntensityMap.min_intensity = intensityMap.parameters.minIntensity
        uIntensityMap.max_intensity = intensityMap.parameters.maxIntensity
        uIntensityMap.size_length = intensityMap.parameters.sizeLength
        uIntensityMap.spacing_length = intensityMap.parameters.spacingLength
        uIntensityMap.inv_dimensions.copy(intensityMap.parameters.invDimensions)
        uIntensityMap.inv_spacing.copy(intensityMap.parameters.invSpacing)
        uIntensityMap.inv_size.copy(intensityMap.parameters.invSize)
 
        uDistanceMap.max_distance = distanceMap.parameters.maxDistance
        uDistanceMap.sub_division = distanceMap.parameters.subDivision
        uDistanceMap.dimensions.copy(distanceMap.parameters.dimensions)
        uDistanceMap.spacing.copy(distanceMap.parameters.spacing)
        uDistanceMap.size.copy(distanceMap.parameters.size)
        uDistanceMap.inv_sub_division = distanceMap.parameters.invSubDivision
        uDistanceMap.inv_dimensions.copy(distanceMap.parameters.invDimensions)
        uDistanceMap.inv_spacing.copy(distanceMap.parameters.invSpacing)
        uDistanceMap.inv_size.copy(distanceMap.parameters.invSize)

        // Update Defines
        defines.MAX_CELL_COUNT = boundingBox.parameters.maxCellCount
        defines.MAX_BLOCK_COUNT = boundingBox.parameters.maxBlockCount
        defines.MAX_CELL_SUB_COUNT = 3 * distanceMap.parameters.subDivision - 2
        defines.MAX_BATCH_COUNT = Math.ceil(defines.MAX_CELL_COUNT / defines.MAX_CELL_SUB_COUNT)
        defines.MAX_BLOCK_SUB_COUNT = Math.ceil(defines.MAX_BLOCK_COUNT / defines.MAX_BATCH_COUNT)
    }

    setMesh()
    {   
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.copy(this.parameters.volume.size).multiplyScalar(-0.5)
        this.scene.add(this.mesh)
    }

    async updateIsosurface(threshold)
    {
        console.log('UPDATE ISOSURFACE')
        console.time('UPDATE ISOSURFACE')

        // Uniforms/Defines
        const uTextures = this.material.uniforms.u_textures.value
        const uRendering = this.material.uniforms.u_rendering.value
        const uIntensityMap = this.material.uniforms.u_intensity_map.value
        const uDistanceMap = this.material.uniforms.u_distance_map.value
        const defines = this.material.defines

        // Recompute Maps
        await this.processor.generateOccupancyMap(threshold, uDistanceMap.sub_division)
        await this.processor.generateDistanceMap(uDistanceMap.max_iterations)
        await this.processor.generateBoundingBox()
        tf.dispose(this.processor.computes.occupancyMap.tensor)

        // Computes
        const distanceMap = this.processor.computes.distanceMap
        const boundingBox = this.processor.computes.boundingBox 

        // Update Textures
        this.textures.distanceMap.dispose()
        this.textures.distanceMap = new THREE.Data3DTexture(
            new Uint8Array(this.processor.computes.distanceMap.tensor.dataSync()), 
            ...distanceMap.parameters.dimensions)
        this.textures.distanceMap.format = THREE.RedFormat
        this.textures.distanceMap.type = THREE.UnsignedByteType
        this.textures.distanceMap.minFilter = THREE.LinearFilter
        this.textures.distanceMap.magFilter = THREE.LinearFilter
        this.textures.distanceMap.computeMipmaps = false
        this.textures.distanceMap.needsUpdate = true
        tf.dispose(this.processor.computes.distanceMap.tensor)
        
        // Update Uniforms
        uRendering.intensity = threshold
        uTextures.distance_map = this.textures.distanceMap
        uDistanceMap.max_distance = distanceMap.parameters.maxDistance
        uDistanceMap.sub_division = distanceMap.parameters.subDivision
        uDistanceMap.dimensions.copy(distanceMap.parameters.dimensions)
        uDistanceMap.spacing.copy(distanceMap.parameters.spacing)
        uDistanceMap.size.copy(distanceMap.parameters.size)
        uDistanceMap.inv_sub_division = distanceMap.parameters.invSubDivision
        uDistanceMap.inv_dimensions.copy(distanceMap.parameters.invDimensions)
        uDistanceMap.inv_spacing.copy(distanceMap.parameters.invSpacing)
        uDistanceMap.inv_size.copy(distanceMap.parameters.invSize)
        uIntensityMap.min_position.copy(boundingBox.parameters.minPosition)
        uIntensityMap.max_position.copy(boundingBox.parameters.maxPosition) 

        // Update Defines
        defines.MAX_CELL_COUNT = boundingBox.parameters.maxCellCount
        defines.MAX_BLOCK_COUNT = boundingBox.parameters.maxBlockCount
        defines.MAX_CELL_SUB_COUNT = 3 * distanceMap.parameters.subDivision - 2
        defines.MAX_BATCH_COUNT = Math.ceil(defines.MAX_CELL_COUNT / defines.MAX_CELL_SUB_COUNT)
        defines.MAX_BLOCK_SUB_COUNT = Math.ceil(defines.MAX_BLOCK_COUNT / defines.MAX_BATCH_COUNT)        

        // Update Material
        this.material.needsUpdate = true
        console.timeEnd('UPDATE ISOSURFACE')
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

    logMemory()
    {
        console.log('TensorFlow', tf.memory())
        console.log('WebGLRenderer', this.renderer.instance.info.memory)
    }
    
}