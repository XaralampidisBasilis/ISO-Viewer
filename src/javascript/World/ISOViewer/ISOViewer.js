import * as THREE from 'three'
import Experience from '../../Experience'
import Configs from '../../Utils/Configs'
import { debugCounterReference, occupancyMapView } from '../../Utils/DebugViews'
import ISOMaterial from './ISOMaterial'

export default class ISOViewer
{
    constructor()
    {
        const experience = new Experience()
        this.computes = experience.computes
        this.configs = experience.configs
        this.material = ISOMaterial()
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.material)
        this.boxEdges = new THREE.EdgesGeometry(this.mesh.geometry)
        this.volumeBox = this.createBoxWireframe(0x99aaff, 1)
        this.boundingBox = this.createBoxWireframe(0xffbd57, 2)
        this.syncShading()
    }

    createBoxWireframe(color, renderOrder)
    {
        const material = new THREE.LineBasicMaterial({ color, transparent: true, depthTest: true, depthWrite: false })
        const wireframe = new THREE.LineSegments(this.boxEdges, material)
        wireframe.renderOrder = renderOrder
        wireframe.visible = false
        this.mesh.add(wireframe)
        return wireframe
    }

    sync()
    {
        const { configs, computes, material } = this
        const { dimensions, spacing, size } = computes.volumeMap
        const blocked = computes.occupancyMap.dimensions
        const uniforms = material.uniforms
        const maxCells = dimensions.x + dimensions.y + dimensions.z
        const maxBlocks = blocked.x + blocked.y + blocked.z
        const cellsPerBlock = configs.blockSize * 3
        const maxGroups = Math.ceil(maxCells / cellsPerBlock)

        this.size = size
        this.mesh.scale.copy(size)
        this.volumeBox.visible = configs.volumeBoxVisible
        const translation = new THREE.Matrix4().makeTranslation(0.5, 0.5, 0.5)
        const scale = new THREE.Matrix4().makeScale(dimensions.x, dimensions.y, dimensions.z)
        uniforms.uCustomModelMatrix.value.multiplyMatrices(scale, translation)

        Object.assign(uniforms.u_textures.value, {
            interpolation_map: computes.interpolationMap.texture,
            occupancy_map: computes.occupancyMap.texture,
            // Some drivers keep every struct sampler active even in occupancy-only variants.
            distance_map: computes.distanceMap?.texture ?? computes.occupancyMap.texture,
        })
        const volume = uniforms.u_volume.value
        volume.isovalue = configs.isosurfaceValue
        volume.block_size = configs.blockSize
        volume.dimensions.copy(dimensions)
        volume.spacing.copy(spacing)
        volume.spacing_normalized.copy(spacing).normalize()
        volume.blocked_dimensions.copy(blocked)
        volume.inv_dimensions.set(1 / dimensions.x, 1 / dimensions.y, 1 / dimensions.z)

        const bounds = uniforms.u_bbox.value
        const occupied = computes.occupancyMap.boundingBox
        bounds.occupied = occupied !== null
        this.boundingBox.visible = bounds.occupied && configs.boundingBoxVisible
        if (occupied)
        {
            const origin = new THREE.Vector3()
            bounds.min_position.fromArray(occupied.minCoords).multiplyScalar(configs.blockSize).subScalar(0.5).clamp(origin, dimensions)
            bounds.max_position.fromArray(occupied.maxCoords).addScalar(1).multiplyScalar(configs.blockSize).subScalar(0.5).clamp(origin, dimensions)
            this.boundingBox.position.addVectors(bounds.min_position, bounds.max_position)
                .divide(dimensions).multiplyScalar(0.5).subScalar(0.5)
            this.boundingBox.scale.subVectors(bounds.max_position, bounds.min_position).divide(dimensions)
        }
        const writeSurfaceDepth = this.volumeBox.visible || this.boundingBox.visible
        material.depthTest = writeSurfaceDepth
        material.depthWrite = writeSurfaceDepth

        const debug = uniforms.u_debug.value
        debug.option = configs.effectiveDebugView
        const occupancyView = debug.option === occupancyMapView
        const debugEnabled = debug.option !== 0 && !occupancyView
        debug.max_groups = maxGroups
        debug.max_blocks = Math.ceil(maxBlocks / maxGroups)
        debug.max_cells = cellsPerBlock
        this.syncShading()

        const defines = {
            INTERPOLATION_METHOD: Configs.InterpolationMethods.indexOf(configs.interpolationMethod),
            GRADIENTS_METHOD: Configs.GradientsMethods.indexOf(configs.gradientsMethod),
            MARCHING_METHOD: Configs.MarchingMethods.indexOf(configs.marchingMethod),
            INTERSECTION_TEST: Configs.IntersectionTests.indexOf(configs.intersectionTest),
            SKIPPING_STRATEGY: Configs.SkippingStrategies.indexOf(configs.skippingStrategy),
            SKIPPING_METHOD: Configs.SkippingMethods.indexOf(configs.skippingMethod),
            SKIPPING_ENABLED: Number(configs.skippingEnabled),
            BBOX_ENABLED: Number(configs.boundingBoxEnabled),
            BERNSTEIN_ENABLED: Number(configs.bernsteinEnabled),
            WRITE_SURFACE_DEPTH: Number(writeSurfaceDepth),
            OCCUPANCY_VIEW: Number(occupancyView),
            OCCUPANCY_WIREFRAME: Number(debug.option === 0 && configs.occupancyWireframeVisible),
            DEBUG_ENABLED: Number(debugEnabled),
            DISCARDING_ENABLED: Number(!debugEnabled),
            VARIATION_METHOD: configs.effectiveRootSolver,
            MAX_CELLS: maxCells,
            MAX_CELLS_IN_BLOCK: cellsPerBlock,
            MAX_TRACES: maxCells * 5,
            MAX_TRACES_IN_BLOCK: cellsPerBlock * 5,
            MAX_BLOCKS: maxBlocks,
            MAX_GROUPS: maxGroups,
            MAX_BLOCKS_IN_GROUP: debug.max_blocks,
        }
        debug.counter_reference = debugCounterReference(debug.option, defines)

        if (Object.keys(defines).some(key => material.defines[key] !== defines[key]))
        {
            Object.assign(material.defines, defines)
            material.needsUpdate = true
        }
    }

    syncShading()
    {
        const shading = this.material.uniforms.u_shading.value
        shading.colormap = Configs.Colormaps.indexOf(this.configs.colormap)
        shading.modulate_gradient = Number(this.configs.gradientShading)
        shading.modulate_curvature = Number(this.configs.curvatureShading)
    }

    destroy()
    {
        this.mesh.removeFromParent()
        this.boxEdges.dispose()
        this.boundingBox.material.dispose()
        this.volumeBox.material.dispose()
        this.mesh.geometry.dispose()
        this.material.dispose()
    }
}
