import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Experience from '../../Experience'
import EventEmitter from '../../Utils/EventEmitter'
import ISOMaterial from './ISOMaterial'
import ISOGui from './ISOGui'
import ISOProcessor from './ISOProcessor'

let floatView = new Float32Array( 1 );
let int32View = new Int32Array( floatView.buffer );

/* This method is faster than the OpenEXR implementation (very often
 * used, eg. in Ogre), with the additional benefit of rounding, inspired
 * by James Tursa?s half-precision code. */
function toHalf( val ) {

    floatView[ 0 ] = val;
    let x = int32View[ 0 ];

    let bits = ( x >> 16 ) & 0x8000; /* Get the sign */
    let m = ( x >> 12 ) & 0x07ff; /* Keep one extra bit for rounding */
    let e = ( x >> 23 ) & 0xff; /* Using int is faster here */

    /* If zero, or denormal, or exponent underflows too much for a denormal
        * half, return signed zero. */
    if ( e < 103 ) return bits;

    /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
    if ( e > 142 ) {

        bits |= 0x7c00;
        /* If exponent was 0xff and one mantissa bit was set, it means NaN,
         * not Inf, so make sure we set one mantissa bit too. */
        bits |= ( ( e == 255 ) ? 0 : 1 ) && ( x & 0x007fffff );
        return bits;

    }

    /* If exponent underflows but not too much, return a denormal */
    if ( e < 113 ) {

        m |= 0x0800;
        /* Extra rounding may overflow and set mantissa to 0 and exponent
         * to 1, which is OK. */
        bits |= ( m >> ( 114 - e ) ) + ( ( m >> ( 113 - e ) ) & 1 );
        return bits;

    }

    bits |= ( ( e - 112 ) << 10 ) | ( m >> 1 );
    /* Extra rounding. An overflow will set mantissa to 0 and increment
     * the exponent, which is OK. */
    bits += m & 1;
    return bits;

}

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
        this.gui = new ISOGui(this)
        this.processor = new ISOProcessor(this.resources.items.intensityMap)
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
        await this.processor.generateOccupancyMap(uRendering.intensity, uDistanceMap.stride)
        await this.processor.generateBoundingBox()
        await this.processor.generateDistanceMap(uDistanceMap.max_iterations)
        await this.processor.generateAnisotropicDistanceMap(uDistanceMap.max_iterations)
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
        this.textures.colorMaps = this.resources.items.colorMaps                      
        this.textures.colorMaps.colorSpace = THREE.SRGBColorSpace
        this.textures.colorMaps.minFilter = THREE.LinearFilter
        this.textures.colorMaps.magFilter = THREE.LinearFilter         
        this.textures.colorMaps.generateMipmaps = false
        this.textures.colorMaps.needsUpdate = true 
        
        // intensity map
        const data = new Uint16Array(this.processor.volume.data.length)
        for (let i = 0; i < this.processor.volume.data.length; i++)
        {
            data[i] = toHalf(this.processor.volume.data[i])
        }
        
        this.textures.intensityMap = new THREE.Data3DTexture(
            data, 
            ...this.processor.volume.parameters.dimensions
        )
        this.textures.intensityMap.format = THREE.RedFormat
        this.textures.intensityMap.type = THREE.HalfFloatType
        this.textures.intensityMap.minFilter = THREE.LinearFilter
        this.textures.intensityMap.magFilter = THREE.LinearFilter
        this.textures.intensityMap.generateMipmaps = false
        this.textures.intensityMap.needsUpdate = true
        delete this.processor.volume.data
        delete this.resources.items.intensityMap.data

        // distance map
        this.textures.distanceMap = new THREE.Data3DTexture(
            new Int8Array(this.processor.computes.distanceMap.tensor.dataSync()), 
            ...this.processor.computes.distanceMap.parameters.dimensions
        )
        this.textures.distanceMap.format = THREE.RedIntegerFormat
        this.textures.distanceMap.type = THREE.ByteType
        this.textures.distanceMap.internalFormat = 'R8I'
        this.textures.distanceMap.minFilter = THREE.NearestFilter
        this.textures.distanceMap.magFilter = THREE.NearestFilter
        this.textures.distanceMap.generateMipmaps = false
        this.textures.distanceMap.needsUpdate = true
        tf.dispose(this.processor.computes.distanceMap.tensor)

        // anisotropic distance map
        this.textures.anisotropicDistanceMap = new THREE.Data3DTexture(
            new Int8Array(this.processor.computes.anisotropicDistanceMap.tensor.dataSync()), 
            ...this.processor.computes.anisotropicDistanceMap.parameters.dimensions
        )
        this.textures.anisotropicDistanceMap.format = THREE.RedIntegerFormat
        this.textures.anisotropicDistanceMap.type = THREE.ByteType
        this.textures.anisotropicDistanceMap.minFilter = THREE.NearestFilter
        this.textures.anisotropicDistanceMap.magFilter = THREE.NearestFilter
        this.textures.anisotropicDistanceMap.generateMipmaps = false
        this.textures.anisotropicDistanceMap.needsUpdate = true
        tf.dispose(this.processor.computes.anisotropicDistanceMap.tensor)

    }
  
    setGeometry()
    {
        const size = new THREE.Vector3().setScalar(1)
        const offset = new THREE.Vector3().setScalar(0.5)
        this.geometry = new THREE.BoxGeometry(...size).translate(offset) 
    }

    setMaterial()
    {        
        // Computes
        const intensityMap = this.processor.computes.intensityMap
        const distanceMap =  this.processor.computes.distanceMap
        const boundingBox = this.processor.computes.boundingBox

        // Uniforms/Defines        
        const uniforms = this.material.uniforms
        const defines = this.material.defines

        // Update Uniforms
        uniforms.u_textures.value.color_maps = this.textures.colorMaps   
        uniforms.u_textures.value.intensity_map = this.textures.intensityMap
        uniforms.u_textures.value.distance_map = this.textures.distanceMap
        uniforms.u_textures.value.anisotropic_distance_map = this.textures.anisotropicDistanceMap

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

        uniforms.u_bbox.value.min_block_coords.copy(boundingBox.parameters.minCellCoords)
        uniforms.u_bbox.value.max_block_coords.copy(boundingBox.parameters.maxCellCoords)
        uniforms.u_bbox.value.min_cell_coords.copy(boundingBox.parameters.minCellCoords)
        uniforms.u_bbox.value.max_cell_coords.copy(boundingBox.parameters.maxCellCoords)
        uniforms.u_bbox.value.min_position.copy(boundingBox.parameters.minPosition)
        uniforms.u_bbox.value.max_position.copy(boundingBox.parameters.maxPosition)

        // Update Defines
        defines.MAX_CELLS = boundingBox.parameters.maxCells
        defines.MAX_BLOCKS = boundingBox.parameters.maxBlocks
        defines.MAX_CELLS_PER_BLOCK = boundingBox.parameters.maxCellsPerBlock
        defines.MAX_GROUPS = Math.ceil(defines.MAX_CELLS / defines.MAX_CELLS_PER_BLOCK)
        defines.MAX_BLOCKS_PER_GROUP = Math.ceil(defines.MAX_BLOCKS / defines.MAX_GROUPS)
    }

    setMesh()
    {   
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.scale.copy(this.parameters.volume.size)
        this.mesh.position.copy(this.parameters.volume.size).multiplyScalar(-0.5)
        this.scene.add(this.mesh)
    }

    async updateIsosurface(threshold)
    {
        // Uniforms/Defines        
        const uniforms = this.material.uniforms
        const defines = this.material.defines

        // Recompute Maps
        await this.processor.generateOccupancyMap(threshold, uniforms.u_distance_map.value.stride)
        await this.processor.generateBoundingBox()
        await this.processor.generateDistanceMap(uniforms.u_distance_map.value.max_iterations)
        await this.processor.generateAnisotropicDistanceMap(uniforms.u_distance_map.value.max_iterations)
        tf.dispose(this.processor.computes.occupancyMap.tensor)

        // Computes
        const distanceMap = this.processor.computes.distanceMap
        const boundingBox = this.processor.computes.boundingBox 

        // Update Textures
        this.textures.distanceMap.dispose()
        this.textures.distanceMap = new THREE.Data3DTexture(
            new Int8Array(this.processor.computes.distanceMap.tensor.dataSync()), 
            ...distanceMap.parameters.dimensions)
        this.textures.distanceMap.format = THREE.RedIntegerFormat
        this.textures.distanceMap.type = THREE.ByteType 
        this.textures.distanceMap.minFilter = THREE.NearestFilter
        this.textures.distanceMap.magFilter = THREE.NearestFilter
        this.textures.distanceMap.generateMipmaps = false
        this.textures.distanceMap.needsUpdate = true
        tf.dispose(this.processor.computes.distanceMap.tensor)

        // anisotropic distance map
        this.textures.anisotropicDistanceMap.dispose()
        this.textures.anisotropicDistanceMap = new THREE.Data3DTexture(
            new Int8Array(this.processor.computes.anisotropicDistanceMap.tensor.dataSync()), 
            ...this.processor.computes.anisotropicDistanceMap.parameters.dimensions
        )
        this.textures.anisotropicDistanceMap.format = THREE.RedIntegerFormat
        this.textures.anisotropicDistanceMap.type = THREE.ByteType
        this.textures.anisotropicDistanceMap.minFilter = THREE.NearestFilter
        this.textures.anisotropicDistanceMap.magFilter = THREE.NearestFilter
        this.textures.anisotropicDistanceMap.generateMipmaps = false
        this.textures.anisotropicDistanceMap.needsUpdate = true
        tf.dispose(this.processor.computes.anisotropicDistanceMap.tensor)

        
        // Update Uniforms
        uniforms.u_rendering.value.intensity = threshold

        uniforms.u_textures.value.distance_map = this.textures.distanceMap
        uniforms.u_textures.value.anisotropic_distance_map = this.textures.anisotropicDistanceMap

        uniforms.u_distance_map.value.max_distance = distanceMap.parameters.maxDistance
        uniforms.u_distance_map.value.stride = distanceMap.parameters.stride
        uniforms.u_distance_map.value.dimensions.copy(distanceMap.parameters.dimensions)
        uniforms.u_distance_map.value.spacing.copy(distanceMap.parameters.spacing)
        uniforms.u_distance_map.value.size.copy(distanceMap.parameters.size)
        uniforms.u_distance_map.value.inv_stride = distanceMap.parameters.invStride
        uniforms.u_distance_map.value.inv_dimensions.copy(distanceMap.parameters.invDimensions)
        uniforms.u_distance_map.value.inv_spacing.copy(distanceMap.parameters.invSpacing)
        uniforms.u_distance_map.value.inv_size.copy(distanceMap.parameters.invSize)

        uniforms.u_bbox.value.min_block_coords.copy(boundingBox.parameters.minCellCoords)
        uniforms.u_bbox.value.max_block_coords.copy(boundingBox.parameters.maxCellCoords)
        uniforms.u_bbox.value.min_cell_coords.copy(boundingBox.parameters.minCellCoords)
        uniforms.u_bbox.value.max_cell_coords.copy(boundingBox.parameters.maxCellCoords)
        uniforms.u_bbox.value.min_position.copy(boundingBox.parameters.minPosition)
        uniforms.u_bbox.value.max_position.copy(boundingBox.parameters.maxPosition)

        // Update Defines
        defines.MAX_CELLS = boundingBox.parameters.maxCells
        defines.MAX_BLOCKS = boundingBox.parameters.maxBlocks
        defines.MAX_CELLS_PER_BLOCK = boundingBox.parameters.maxCellsPerBlock
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