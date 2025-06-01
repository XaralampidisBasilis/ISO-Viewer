import * as THREE from 'three'
import Experience from '../../Experience'
import ISOViewer from './ISOViewer'
import vertexShader from '../../../shaders/iso_raycast/vertex.glsl'
import fragmentShader from '../../../shaders/iso_raycast/fragment.glsl'

export default class ISORaycast
{
    static instance = null

    constructor() 
    {
        this.viewer = new ISOViewer()
        this.experience = new Experience()
        this.renderer = this.experience.renderer
        this.camera = this.experience.camera
        this.sizes = this.experience.sizes

        // Wait for textures
        this.viewer.on('ready', () =>
        {
            this.textures = this.viewer.textures
            this.geometry = this.viewer.geometry
            this.scene = new THREE.Scene()
        })
    }

    setTarget()
    {
        this.target = new THREE.WebGLRenderTarget(this.sizes.width, this.sizes.height, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            depthBuffer: true,
            stencilBuffer: true
        })
    }

    setMaterial()
    {        
        
        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            depthWrite: false,
            depthTest: false,
            stencilWrite: true,
            stencilRef: 1,
            stencilFunc: THREE.AlwaysStencilFunc,
            stencilZPass: THREE.ReplaceStencilOp,
        })

        // Uniforms
        const uniforms = this.material.uniforms
        const distanceMap =  this.computes.distanceMap

        uniforms.u_textures.value.occupancy_map = this.textures.occupancyMap
        uniforms.u_textures.value.distance_map = this.textures.distanceMap
        uniforms.u_textures.value.anisotropic_distance_map = this.textures.anisotropicDistanceMap
        uniforms.u_textures.value.extended_anisotropic_distance_map = this.textures.extendedAnisotropicDistanceMap
    
        uniforms.u_distance_map.value.stride = distanceMap.stride
        uniforms.u_distance_map.value.dimensions.copy(distanceMap.dimensions)
        uniforms.u_distance_map.value.spacing.copy(distanceMap.spacing)
        uniforms.u_distance_map.value.size.copy(distanceMap.size)
        uniforms.u_distance_map.value.inv_stride = distanceMap.invStride
        uniforms.u_distance_map.value.inv_dimensions.copy(distanceMap.invDimensions)
        uniforms.u_distance_map.value.inv_spacing.copy(distanceMap.invSpacing)
        uniforms.u_distance_map.value.inv_size.copy(distanceMap.invSize)

        // Defines
        this.material.defines.MAX_BLOCKS = distanceMap.dimensions.toArray().reduce((s, x) => s + x, -2)
    }

    setMesh()
    {   
        const size = this.computes.intensityMap.size

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.scale.copy(size)
        this.mesh.position.copy(size).multiplyScalar(-0.5)
        this.scene.add(this.mesh)
    }

    render() 
    {
        this.renderer.instance.setRenderTarget(this.target)
        this.renderer.instance.clear()
        this.renderer.instance.render(this.scene, this.camera.instance)
        this.renderer.instance.setRenderTarget(null)
    }

    get texture() 
    {
        return this.target.texture
    }

    dispose() 
    {
        this.target.dispose()
        this.material.dispose()
    }
}