import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Experience from '../../Experience'
import EventEmitter from '../../Utils/EventEmitter'
import ISOMaterial from './ISOMaterial'
import ISOGui from './ISOGui'
import ISOComputes from './ISOComputes'
import ISOTextures from './ISOTextures'

export default class ISOViewer extends EventEmitter
{
    static instance = null

    constructor()
    {
        super()

        // singleton
        if (ISOViewer.instance) 
        {
            return ISOViewer.instance
        }
        ISOViewer.instance = this

        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.renderer = this.experience.renderer
        this.camera = this.experience.camera
        this.sizes = this.experience.sizes
        this.debug = this.experience.debug
        this.material = ISOMaterial()
        this.computes = new ISOComputes()
        this.textures = new ISOTextures()

        // Wait for textures
        this.textures.on('ready', () =>
        {
            this.setGeometry()
            this.setMaterial()
            this.setMesh()

            this.gui = new ISOGui(this)
            this.trigger('ready')
        })
    }
  
    setGeometry()
    {
        const size = new THREE.Vector3().setScalar(1)
        const offset = new THREE.Vector3().setScalar(0.5)
        this.geometry = new THREE.BoxGeometry(...size).translate(offset) 
    }

    setMaterial()
    {        
        // Uniforms/Defines        
        const uniforms = this.material.uniforms
        const defines = this.material.defines

        // Computes
        const intensityMap = this.computes.intensityMap
        const distanceMap =  this.computes.distanceMap
        const boundingBox = this.computes.boundingBox

        // Update Uniforms
        uniforms.u_textures.value.intensity_map = this.textures.intensityMap
        uniforms.u_textures.value.distance_map = this.textures.distanceMap
        uniforms.u_textures.value.color_maps = this.textures.colorMaps   

        uniforms.u_intensity_map.value.dimensions.copy(intensityMap.parameters.dimensions)
        uniforms.u_intensity_map.value.spacing.copy(intensityMap.parameters.spacing)
        uniforms.u_intensity_map.value.size.copy(intensityMap.parameters.size)
        uniforms.u_intensity_map.value.size_length = intensityMap.parameters.sizeLength
        uniforms.u_intensity_map.value.spacing_length = intensityMap.parameters.spacingLength
        uniforms.u_intensity_map.value.inv_dimensions.copy(intensityMap.parameters.invDimensions)
        uniforms.u_intensity_map.value.inv_spacing.copy(intensityMap.parameters.invSpacing)
        uniforms.u_intensity_map.value.inv_size.copy(intensityMap.parameters.invSize)
 
        uniforms.u_distance_map.value.max_distance = distanceMap.parameters.maxDistance
        uniforms.u_distance_map.value.stride = distanceMap.parameters.stride
        uniforms.u_distance_map.value.dimensions.copy(distanceMap.parameters.dimensions)
        uniforms.u_distance_map.value.spacing.copy(distanceMap.parameters.spacing)
        uniforms.u_distance_map.value.size.copy(distanceMap.parameters.size)
        uniforms.u_distance_map.value.inv_stride = distanceMap.parameters.invStride
        uniforms.u_distance_map.value.inv_dimensions.copy(distanceMap.parameters.invDimensions)
        uniforms.u_distance_map.value.inv_spacing.copy(distanceMap.parameters.invSpacing)
        uniforms.u_distance_map.value.inv_size.copy(distanceMap.parameters.invSize)

        uniforms.u_bbox.value.min_coords.copy(boundingBox.parameters.minCellCoords)
        uniforms.u_bbox.value.max_coords.copy(boundingBox.parameters.maxCellCoords)
        uniforms.u_bbox.value.min_position.copy(boundingBox.parameters.minPosition)
        uniforms.u_bbox.value.max_position.copy(boundingBox.parameters.maxPosition)

        // Update Defines
        defines.MAX_CELLS = boundingBox.parameters.maxCellCount
        defines.MAX_BLOCKS = boundingBox.parameters.maxBlockCount
        defines.MAX_CELLS_PER_BLOCK = 3 * distanceMap.parameters.stride - 2
        defines.MAX_GROUPS = Math.ceil(defines.MAX_CELLS / defines.MAX_CELLS_PER_BLOCK)
        defines.MAX_BLOCKS_PER_GROUP = Math.ceil(defines.MAX_BLOCKS / defines.MAX_GROUPS)
    }

    setMesh()
    {   
        const intensityMap = this.computes.intensityMap
        const size = intensityMap.parameters.size

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.scale.copy(size)
        this.mesh.position.copy(size).multiplyScalar(-0.5)
        this.scene.add(this.mesh)
    }


    async update(threshold)
    {
        // Uniforms/Defines        
        const uniforms = this.material.uniforms
        const defines = this.material.defines

        // Update threshold
        uniforms.u_rendering.value.intensity = threshold


        await this.computes.update()
        await this.textures.update()

        // Computes
        const distanceMap = this.processor.computes.distanceMap
        const boundingBox = this.processor.computes.boundingBox 
        
        // Update Uniforms
        uniforms.u_textures.value.distance_map = this.textures.distanceMap
        uniforms.u_distance_map.value.max_distance = distanceMap.parameters.maxDistance
        uniforms.u_distance_map.value.stride = distanceMap.parameters.stride
        uniforms.u_distance_map.value.dimensions.copy(distanceMap.parameters.dimensions)
        uniforms.u_distance_map.value.spacing.copy(distanceMap.parameters.spacing)
        uniforms.u_distance_map.value.size.copy(distanceMap.parameters.size)
        uniforms.u_distance_map.value.inv_stride = distanceMap.parameters.invStride
        uniforms.u_distance_map.value.inv_dimensions.copy(distanceMap.parameters.invDimensions)
        uniforms.u_distance_map.value.inv_spacing.copy(distanceMap.parameters.invSpacing)
        uniforms.u_distance_map.value.inv_size.copy(distanceMap.parameters.invSize)

        uniforms.u_bbox.value.min_coords.copy(boundingBox.parameters.minCellCoords)
        uniforms.u_bbox.value.max_coords.copy(boundingBox.parameters.maxCellCoords)
        uniforms.u_bbox.value.min_position.copy(boundingBox.parameters.minPosition)
        uniforms.u_bbox.value.max_position.copy(boundingBox.parameters.maxPosition)

        // Update Defines
        defines.MAX_CELLS = boundingBox.parameters.maxCellCount
        defines.MAX_BLOCKS = boundingBox.parameters.maxBlockCount
        defines.MAX_CELLS_PER_BLOCK = 3 * distanceMap.parameters.stride - 2
        defines.MAX_GROUPS = Math.ceil(defines.MAX_CELLS / defines.MAX_CELLS_PER_BLOCK)
        defines.MAX_BLOCKS_PER_GROUP = Math.ceil(defines.MAX_BLOCKS / defines.MAX_GROUPS)      

        // Update Material
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
}