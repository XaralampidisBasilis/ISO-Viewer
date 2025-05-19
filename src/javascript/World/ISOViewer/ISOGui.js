
import { colormapLocations } from '../../../../static/textures/colormaps/colormaps'
import ISOViewer from './ISOViewer'

export default class ISOGui
{
    constructor()
    {
        this.viewer = new ISOViewer()
        this.debug = this.viewer.debug

        // setup
        if (this.debug.active)
        {
            this.addFolders()
            this.addSubfolders()
            this.addControllers()
        }
    }

    addFolders()
    {
        this.folders = {}
        this.folders.viewer = this.debug.ui.addFolder('ISOViewer').open()
    }

    addSubfolders()
    {
        this.subfolders          = {}
        this.subfolders.rendering = this.folders.viewer.addFolder('rendering').close()
        this.subfolders.colormap = this.folders.viewer.addFolder('colormap').close()
        this.subfolders.shading  = this.folders.viewer.addFolder('shading').close()
        this.subfolders.lighting = this.folders.viewer.addFolder('lighting').close()
        this.subfolders.debugging = this.folders.viewer.addFolder('debugging').close()

        this.addToggles()            
    }

    addToggles()
    {
        const subfolders = Object.values(this.subfolders)

        const closeOtherFolders = (openFolder) => 
        {
            subfolders.forEach((folder) => 
            {
                if (folder !== openFolder && !folder._closed) folder.close()
            })
        }

        subfolders.forEach((folder) => 
        {
            folder.onOpenClose((openFolder) => 
            {
                if (!openFolder._closed) closeOtherFolders(openFolder)
            })
        })
    }

    // controllers
    
    addControllers()
    {
        this.controllers = {}
        this.addControllersRendering() 
        this.addControllersColormap() 
        this.addControllersShading() 
        this.addControllersLighting() 
        this.addControllersDebugging() 
        
        // this.setBindings()  
    }

    addControllersRendering() 
    {
        const folder = this.subfolders.rendering
        const material = this.viewer.material
        const defines = this.viewer.material.defines
        const uRendering = this.viewer.material.uniforms.u_rendering.value
        const uDistanceMap = this.viewer.material.uniforms.u_distance_map.value
        const objects = 
        { 
            intensity               : uRendering.intensity,
            INTERSECT_BBOX_ENABLED  : Boolean(defines.INTERSECT_BBOX_ENABLED),
            INTERSECT_BVOL_ENABLED  : Boolean(defines.INTERSECT_BVOL_ENABLED),
            SKIPPING_ENABLED        : Boolean(defines.SKIPPING_ENABLED),
        }
    
        this.controllers.rendering = 
        {
            isoIntensity       : folder.add(objects, 'intensity').min(0).max(1).step(0.0001).onFinishChange((value) => { this.viewer.updateIsosurface(value) }),
            maxGroups          : folder.add(uRendering, 'max_groups').min(0).max(1000).step(1),
            maxCellCount       : folder.add(uRendering, 'max_cells').min(0).max(1000).step(1),
            maxBlockCount      : folder.add(uRendering, 'max_blocks').min(0).max(200).step(1),
            enableIntersectBbox: folder.add(objects, 'INTERSECT_BBOX_ENABLED').name('intersect_bbox').onFinishChange((value) => { defines.INTERSECT_BBOX_ENABLED = Number(value), material.needsUpdate = true }),
            enableIntersectBvol: folder.add(objects, 'INTERSECT_BVOL_ENABLED').name('intersect_bvol').onFinishChange((value) => { defines.INTERSECT_BVOL_ENABLED = Number(value), material.needsUpdate = true }),
            enableSkipping     : folder.add(objects, 'SKIPPING_ENABLED').name('skipping').onFinishChange((value) => { defines.SKIPPING_ENABLED = Number(value), material.needsUpdate = true }),
        }
    }

    addControllersColormap() 
    {
        const folder = this.subfolders.colormap
        const uniforms = this.viewer.material.uniforms.u_color_map.value
        const objects = { flip: false }
    
        this.controllers.colormap = 
        {
            name        : folder.add(uniforms, 'name').options(Object.keys(colormapLocations)).onChange(() => this.updateColormap()),
            minThreshold: folder.add(uniforms.thresholds, 'x').name('min_threshold').min(0).max(1).step(0.001),
            maxThreshold: folder.add(uniforms.thresholds, 'y').name('max_threshold').min(0).max(1).step(0.001),
            levels      : folder.add(uniforms, 'levels').min(1).max(255).step(1),
            flip        : folder.add(objects, 'flip').onChange(() => this.flipColormap())
        }

    }
    
    addControllersShading() 
    {
        const folder = this.subfolders.shading
        const uniforms = this.viewer.material.uniforms.u_shading.value

        this.controllers.shading = 
        {
            ambientReflectance : folder.add(uniforms, 'ambient_reflectance').min(0).max(1).step(0.001),
            diffuseReflectance : folder.add(uniforms, 'diffuse_reflectance').min(0).max(1).step(0.001),
            specularReflectance: folder.add(uniforms, 'specular_reflectance').min(0).max(1).step(0.001),
            shininess          : folder.add(uniforms, 'shininess').min(0).max(40.0).step(0.2),
            edgeContrast       : folder.add(uniforms, 'edge_contrast').min(0).max(1).step(0.001),
        }
    }

    addControllersLighting() 
    {
        const folder = this.subfolders.lighting
        const uniforms = this.viewer.material.uniforms.u_lighting.value

        this.controllers.lighting = 
        {
            intensity        : folder.add(uniforms, 'intensity').min(0).max(2.0).step(0.001),
            shadows          : folder.add(uniforms, 'shadows').min(0).max(1.0).step(0.001),
            ambient_color    : folder.addColor(uniforms, 'ambient_color'),
            diffuse_color    : folder.addColor(uniforms, 'diffuse_color'),
            specular_color   : folder.addColor(uniforms, 'specular_color'),
            positionX        : folder.add(uniforms.position_offset, 'x').min(-5).max(5).step(0.01).name('position_x'),
            positionY        : folder.add(uniforms.position_offset, 'y').min(-5).max(5).step(0.01).name('position_y'),
            positionZ        : folder.add(uniforms.position_offset, 'z').min(-5).max(5).step(0.01).name('position_z'),
        }
    }
    
    addControllersDebugging()
    {
        const folder = this.subfolders.debugging
        const uniforms = this.viewer.material.uniforms.u_debugging.value
        const defines = this.viewer.material.defines
        const material = this.viewer.material
        const objects = { DISCARDING_DISABLED: Boolean(defines.DISCARDING_DISABLED) }

        this.controllers.debugging = 
        {
            option: folder.add(uniforms, 'option').options(
            { 
                default                 : 0,

                ray_discarded           : 101,
                ray_direction           : 102,
                ray_signs               : 103,
                ray_group               : 104,
                ray_spacing             : 105,
                ray_start_distance      : 106,
                ray_end_distance        : 107,
                ray_span_distance       : 108,
                ray_start_position      : 109,
                ray_end_position        : 110,
                 
                trace_intersected       : 201,
                trace_terminated        : 202,
                trace_exhausted         : 203,
                trace_outside           : 204,
                trace_distance          : 205,
                trace_position          : 206,
                trace_intensity         : 207,
                trace_error             : 208,
                trace_abs_error         : 209,
                trace_gradient          : 210,
                trace_gradient_length   : 211,
                trace_curvature         : 212,
                
                cell_intersected        : 301,
                cell_terminated         : 302,
                cell_coords             : 303,
                cell_axes               : 304,
                cell_max_position       : 305,
                cell_min_position       : 306,
                cell_entry_distance     : 307,
                cell_exit_distance      : 308,
                cell_span_distance      : 309,

                block_radius            : 401,
                block_radii             : 402,
                block_occupied          : 403,
                block_terminated        : 404,
                block_coords            : 405,
                block_min_position      : 406,
                block_max_position      : 407,
                block_entry_distance    : 408,
                block_exit_distance     : 409,
                block_entry_position    : 410,
                block_exit_position     : 411,

                surface_orientation     : 451,
                surface_normal          : 452,
                surface_gradient        : 453,
                surface_curvient1       : 454,
                surface_curvient2       : 455,
                surface_steepness       : 456,
                surface_laplacian       : 457,
                surface_curvatures      : 458,
                surface_mean_curvature  : 459,
                surface_gauss_curvature : 460,
                surface_max_curvature   : 461,
                surface_soft_curvature  : 462,

                frag_depth              : 501,
                frag_position           : 502,
                frag_normal_vector      : 503,
                frag_view_vector        : 504,
                frag_light_vector       : 505,
                frag_halfway_vector     : 506,
                frag_view_angle         : 507,
                frag_light_angle        : 508,
                frag_halfway_angle      : 509,
                frag_camera_angle       : 510,
                frag_material_color     : 511,
                frag_ambient_color      : 512,
                frag_diffuse_color      : 513,
                frag_specular_color     : 514,
                frag_direct_color       : 515,
                frag_color              : 516,
                frag_shaded_luminance   : 517,
                frag_edge_factor        : 518,
                frag_gradient_factor    : 519,

                box_entry_distance      : 601,
                box_exit_distance       : 602,
                box_span_distance       : 603,
                box_entry_position      : 604,
                box_exit_position       : 605,

                camera_position         : 701,
                camera_direction        : 702,

                poly_distances          : 801,
                poly_intensities        : 802,
                poly_coefficients       : 803,

                stats_num_fetches       : 901,
                stats_num_cells         : 902,
                stats_num_blocks        : 903,
                
                variable1               : 1001,
                variable2               : 1002,
                variable3               : 1003,
            }),

            variable1 : folder.add(uniforms, 'variable1').min(0).max(1).step(0.001),
            variable2 : folder.add(uniforms, 'variable2').min(0).max(1).step(0.001),
            variable3 : folder.add(uniforms, 'variable3').min(0).max(1).step(0.001),
            variable4 : folder.add(uniforms, 'variable4').min(0).max(1).step(0.001),
            variable5 : folder.add(uniforms, 'variable5').min(0).max(1).step(0.001),
            discarding: folder.add(objects, 'DISCARDING_DISABLED').name('disable_discarding').onFinishChange((value) => { defines.DISCARDING_DISABLED = Number(value), material.needsUpdate = true }),
        }
    }
    
    // controllers bindings

    flipColormap()
    {
        // let colormap = this.viewer.material.uniforms.u_color_map.value
        [this.viewer.material.uniforms.u_color_map.value.start_coords.x, this.viewer.material.uniforms.u_color_map.value.end_coords.x] = 
        [this.viewer.material.uniforms.u_color_map.value.end_coords.x, this.viewer.material.uniforms.u_color_map.value.start_coords.x]      
    }

    updateColormap()
    {
        let { x_start, x_end, y } = colormapLocations[this.controllers.colormap.name.getValue()]
        this.viewer.material.uniforms.u_color_map.value.start_coords.set(x_start, y)
        this.viewer.material.uniforms.u_color_map.value.end_coords.set(x_end, y)      
    }

    destroy() {

        // Dispose of controllers
        Object.values(this.controllers).forEach(group => {
            Object.values(group).forEach(controller => {
                controller.remove()
            })
        })
    
        // Dispose of subfolders
        Object.values(this.subfolders).forEach(subfolder => {
            subfolder.close();
            subfolder.destroy()
        })
    
        // Dispose of folders
        Object.values(this.folders).forEach(folder => {
            folder.close()
            folder.destroy()
        })
    
    
        // Clear references
        this.controllers = null
        this.subfolders = null
        this.folders = null
        this.debug = null
        this.viewer = null
    }
    
}
