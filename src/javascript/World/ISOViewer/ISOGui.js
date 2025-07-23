
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
            isovalue            : uRendering.isovalue,
            stride              : uDistanceMap.stride,
            BERNSTEIN_ENABLED   : Boolean(defines.BERNSTEIN_ENABLED),
            VARIATION_ENABLED   : Boolean(defines.VARIATION_ENABLED),
            SKIPPING_ENABLED    : Boolean(defines.SKIPPING_ENABLED),
            INTERPOLATION_METHOD: Number(defines.INTERPOLATION_METHOD),
            SKIPPING_METHOD     : Number(defines.SKIPPING_METHOD),
            GRADIENTS_METHOD    : Number(defines.GRADIENTS_METHOD),
        }
    
        this.controllers.rendering = 
        {
            isovalue: folder.add(objects, 'isovalue').min(0).max(1).step(0.0001).onFinishChange((threshold) => 
            { 
                this.viewer.onThresholdChange(threshold) 
            }),
            
            stride : folder.add(objects, 'stride').min(2).max(8).step(1).onFinishChange((stride) => 
            { 
                this.viewer.onStrideChange(stride) 
            }),

            maxGroups              : folder.add(uRendering, 'max_groups').min(0).max(1000).step(1),
            maxCellCount           : folder.add(uRendering, 'max_cells').min(0).max(1000).step(1),
            maxBlockCount          : folder.add(uRendering, 'max_blocks').min(0).max(200).step(1),
            enableVariation        : folder.add(objects, 'VARIATION_ENABLED').name('variation').onFinishChange((value) => { defines.VARIATION_ENABLED = Number(value), material.needsUpdate = true }),
            enableBernstein        : folder.add(objects, 'BERNSTEIN_ENABLED').name('bernstein').onFinishChange((value) => { defines.BERNSTEIN_ENABLED = Number(value), material.needsUpdate = true }),
            enableSkipping         : folder.add(objects, 'SKIPPING_ENABLED').name('skipping').onFinishChange((value) => { defines.SKIPPING_ENABLED = Number(value), material.needsUpdate = true }),

            interpolationMethod: folder.add(objects, 'INTERPOLATION_METHOD').name('interpolation').options({ trilinear : 1, tricubic : 2 }).onFinishChange((option) => 
            { 
                this.viewer.onInterpolationChange(option) 
            }),

            gradientsMethod: folder.add(objects, 'GRADIENTS_METHOD').name('gradients').options({ analytic : 1, sobel : 2, bspline2 : 3, bspline3 : 4 }).onFinishChange((option) => 
            { 
                defines.GRADIENTS_METHOD = Number(option)
                material.needsUpdate = true 
            }),

            skippingMethod: folder.add(objects, 'SKIPPING_METHOD').name('skipping').options({ occupancy : 1, isotropic : 2, anisotropic : 3, extended : 4 }).onFinishChange((option) => 
            { 
                defines.SKIPPING_METHOD = Number(option)
                material.needsUpdate = true 
            }),
        }
    }

    addControllersColormap() 
    {
        const folder = this.subfolders.colormap
        const uniforms = this.viewer.material.uniforms.u_colormap.value
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
            ambientreflect : folder.add(uniforms, 'reflect_ambient').min(0).max(1).step(0.001),
            diffusereflect : folder.add(uniforms, 'reflect_diffuse').min(0).max(1).step(0.001),
            specularreflect: folder.add(uniforms, 'reflect_specular').min(0).max(1).step(0.001),
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
            color_ambient    : folder.addColor(uniforms, 'color_ambient'),
            color_diffuse    : folder.addColor(uniforms, 'color_diffuse'),
            color_specular   : folder.addColor(uniforms, 'color_specular'),
            positionX        : folder.add(uniforms.position_offset, 'x').min(-5).max(5).step(0.01).name('position_x'),
            positionY        : folder.add(uniforms.position_offset, 'y').min(-5).max(5).step(0.01).name('position_y'),
            positionZ        : folder.add(uniforms.position_offset, 'z').min(-5).max(5).step(0.01).name('position_z'),
        }
    }
    
    addControllersDebugging()
    {
        const folder = this.subfolders.debugging
        const uniforms = this.viewer.material.uniforms.u_debug.value
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
                ray_spacing             : 104,
                ray_start_distance      : 105,
                ray_end_distance        : 106,
                ray_span_distance       : 107,
                ray_start_position      : 108,
                ray_end_position        : 109,
                
                cell_intersected        : 301,
                cell_terminated         : 302,
                cell_coords             : 303,
                cell_axes               : 304,
                cell_max_position       : 305,
                cell_min_position       : 306,
                cell_entry_distance     : 307,
                cell_exit_distance      : 308,
                cell_span_distance      : 309,

                block_skip_distance     : 401,
                block_skip_distances    : 402,
                block_occupied          : 403,
                block_terminated        : 404,
                block_coords            : 405,
                block_min_position      : 406,
                block_max_position      : 407,
                block_entry_distance    : 408,
                block_exit_distance     : 409,
                block_entry_position    : 410,
                block_exit_position     : 411,

                hit_discarded           : 201,
                hit_distance            : 202,
                hit_position            : 203,
                hit_residue             : 204,
                hit_normal              : 205,
                hit_gradient            : 206,
                hit_steepness           : 207,
                hit_curvatures          : 208,
                hit_mean_curvature      : 209,
                hit_gauss_curvature     : 210,
                hit_max_curvature       : 211,
                hit_total_curvature     : 212,
               
                frag_color_material     : 511,
                frag_color_ambient      : 512,
                frag_color_diffuse      : 513,
                frag_color_specular     : 514,
                frag_direct_color       : 515,
                frag_color              : 516,
                frag_shaded_luminance   : 517,

                box_entry_distance      : 601,
                box_exit_distance       : 602,
                box_span_distance       : 603,
                box_entry_position      : 604,
                box_exit_position       : 605,

                camera_position         : 701,
                camera_direction        : 702,

                cubic_distances         : 801,
                cubic_intensities       : 802,
                cubic_coefficients      : 803,

                stats_num_fetches       : 901,
                stats_num_cells         : 902,
                stats_num_blocks        : 903,
                stats_num_checks        : 904,
                
                debug_variable0         : 1000,
                debug_variable1         : 1001,
                debug_variable2         : 1002,
                debug_variable3         : 1003,
                debug_variable4         : 1004,
                debug_variable5         : 1005,
                debug_variable6         : 1006,
                debug_variable7         : 1007,
                debug_variable8         : 1008,
                debug_variable9         : 1009,
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
        // let colormap = this.viewer.material.uniforms.u_colormap.value
        [this.viewer.material.uniforms.u_colormap.value.start_coords.x, this.viewer.material.uniforms.u_colormap.value.end_coords.x] = 
        [this.viewer.material.uniforms.u_colormap.value.end_coords.x, this.viewer.material.uniforms.u_colormap.value.start_coords.x]      
    }

    updateColormap()
    {
        let { x_start, x_end, y } = colormapLocations[this.controllers.colormap.name.getValue()]
        this.viewer.material.uniforms.u_colormap.value.start_coords.set(x_start, y)
        this.viewer.material.uniforms.u_colormap.value.end_coords.set(x_end, y)      
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
