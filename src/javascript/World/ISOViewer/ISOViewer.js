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

            this.gui = new ISOGui()
            this.trigger('ready')
            console.log('ISOViewer', this)
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
        // Uniforms
        const uniforms = this.material.uniforms
        const intensityMap = this.computes.intensityMap
        const distanceMap =  this.computes.distanceMap
        const boundingBox = this.computes.boundingBox

        uniforms.u_textures.value.color_maps = this.textures.colorMaps   
        uniforms.u_textures.value.intensity_map = this.textures.intensityMap
        uniforms.u_textures.value.trilaplacian_intensity_map = this.textures.trilaplacianIntensityMap
        uniforms.u_textures.value.occupancy_map = this.textures.occupancyMap
        uniforms.u_textures.value.distance_map = this.textures.distanceMap
        uniforms.u_textures.value.anisotropic_distance_map = this.textures.anisotropicDistanceMap
        uniforms.u_textures.value.extended_anisotropic_distance_map = this.textures.extendedAnisotropicDistanceMap

        uniforms.u_intensity_map.value.dimensions.copy(intensityMap.dimensions)
        uniforms.u_intensity_map.value.spacing.copy(intensityMap.spacing)
        uniforms.u_intensity_map.value.size.copy(intensityMap.size)
        uniforms.u_intensity_map.value.size_length = intensityMap.sizeLength
        uniforms.u_intensity_map.value.spacing_length = intensityMap.spacingLength
        uniforms.u_intensity_map.value.inv_dimensions.copy(intensityMap.invDimensions)
        uniforms.u_intensity_map.value.inv_spacing.copy(intensityMap.invSpacing)
        uniforms.u_intensity_map.value.inv_size.copy(intensityMap.invSize)
 
        uniforms.u_distance_map.value.stride = distanceMap.stride
        uniforms.u_distance_map.value.dimensions.copy(distanceMap.dimensions)
        uniforms.u_distance_map.value.spacing.copy(distanceMap.spacing)
        uniforms.u_distance_map.value.size.copy(distanceMap.size)
        uniforms.u_distance_map.value.inv_stride = distanceMap.invStride
        uniforms.u_distance_map.value.inv_dimensions.copy(distanceMap.invDimensions)
        uniforms.u_distance_map.value.inv_spacing.copy(distanceMap.invSpacing)
        uniforms.u_distance_map.value.inv_size.copy(distanceMap.invSize)

        uniforms.u_bbox.value.min_block_coords.copy(boundingBox.minCellCoords)
        uniforms.u_bbox.value.max_block_coords.copy(boundingBox.maxCellCoords)
        uniforms.u_bbox.value.min_cell_coords.copy(boundingBox.minCellCoords)
        uniforms.u_bbox.value.max_cell_coords.copy(boundingBox.maxCellCoords)
        uniforms.u_bbox.value.min_position.copy(boundingBox.minPosition)
        uniforms.u_bbox.value.max_position.copy(boundingBox.maxPosition)

        // Defines
        const defines = this.material.defines
        defines.MAX_CELLS = intensityMap.dimensions.toArray().reduce((s, x) => s + x, -2)
        defines.MAX_BLOCKS = distanceMap.dimensions.toArray().reduce((s, x) => s + x, -2)
        defines.MAX_CELLS_PER_BLOCK = distanceMap.stride * 3
        defines.MAX_GROUPS = Math.ceil(defines.MAX_CELLS / defines.MAX_CELLS_PER_BLOCK)
        defines.MAX_BLOCKS_PER_GROUP = Math.ceil(defines.MAX_BLOCKS / defines.MAX_GROUPS)
    }

    setMesh()
    {   
        const size = this.computes.intensityMap.size

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.scale.copy(size)
        this.mesh.position.copy(size).multiplyScalar(-0.5)
        this.scene.add(this.mesh)
    }

    async onThresholdChange(threshold)
    {
        const uniforms = this.material.uniforms
        uniforms.u_rendering.value.intensity = threshold

        await this.computes.onThresholdChange()
        await this.textures.onThresholdChange()
        
        // Update 
        uniforms.u_bbox.value.min_block_coords.copy(this.computes.boundingBox.minCellCoords)
        uniforms.u_bbox.value.max_block_coords.copy(this.computes.boundingBox.maxCellCoords)
        uniforms.u_bbox.value.min_cell_coords.copy(this.computes.boundingBox.minCellCoords)
        uniforms.u_bbox.value.max_cell_coords.copy(this.computes.boundingBox.maxCellCoords)
        uniforms.u_bbox.value.min_position.copy(this.computes.boundingBox.minPosition)
        uniforms.u_bbox.value.max_position.copy(this.computes.boundingBox.maxPosition)
    }

    destroy() 
    {
        if (this.computes)
        {
            this.computes.destroy()
            this.computes = null
        }

        if (this.textures)
        {
            this.textures.destroy()
            this.textures = null
        }

        if (this.mesh) 
        {
            this.scene.remove(this.mesh)
            this.mesh.geometry.dispose()
            this.mesh.material.dispose()
            this.mesh = null
        }
    
        if (this.gui) 
        {
            this.gui.destroy()
            this.gui = null
        }

        // Clean up references
        this.scene = null
        this.resources = null
        this.renderer = null
        this.camera = null
        this.sizes = null
        this.debug = null

        console.log("ISOViewer destroyed")
    } 
}