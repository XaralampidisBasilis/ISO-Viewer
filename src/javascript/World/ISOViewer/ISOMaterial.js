import * as THREE from 'three'
import { colormapLocations } from '../../../../static/textures/colormaps/colormaps.js'
import vertexShader from '../../../shaders/iso_viewer/vertex.glsl'
import fragmentShader from '../../../shaders/iso_viewer/fragment.glsl'

export default function()
{
    const uniforms = 
    {
        u_textures: new THREE.Uniform
        ({
            intensity_map : null,
            occupancy_map : null,
            distance_map  : null,
            color_maps    : null,
        }),

        u_intensity_map : new THREE.Uniform
        ({
            dimensions            : new THREE.Vector3(),
            spacing               : new THREE.Vector3(),
            size                  : new THREE.Vector3(),
            spacing_length        : 0.0,
            size_length           : 0.0,
            inv_dimensions        : new THREE.Vector3(),
            inv_spacing           : new THREE.Vector3(),
            inv_size              : new THREE.Vector3(),
            min_position          : new THREE.Vector3(),
            max_position          : new THREE.Vector3(),
            min_intensity         : 0.0,
            max_intensity         : 0.0,
        }),

        u_distance_map : new THREE.Uniform
        ({
            max_distance    : 0,
            max_iterations  : 50,
            sub_division    : 4,
            dimensions      : new THREE.Vector3(),
            spacing         : new THREE.Vector3(),
            size            : new THREE.Vector3(),
            inv_sub_division: 0.25,
            inv_dimensions  : new THREE.Vector3(),
            inv_spacing     : new THREE.Vector3(),
            inv_size        : new THREE.Vector3(),
        }),

        u_color_map: new THREE.Uniform
        ({
            levels      : 255,
            name        : 'cet_d9',
            thresholds  : new THREE.Vector2(0, 1),
            start_coords: new THREE.Vector2(colormapLocations['cet_d9'].x_start, colormapLocations['cet_d9'].y),
            end_coords  : new THREE.Vector2(colormapLocations['cet_d9'].x_end,   colormapLocations['cet_d9'].y),
        }),
        
        u_rendering: new THREE.Uniform
        ({
            intensity   : 0.53,
            max_count       : 0,
            max_cell_count  : 0,
            max_block_count : 0,
        }),

        u_shading: new THREE.Uniform
        ({
            ambient_reflectance  : 0.2,
            diffuse_reflectance  : 1.0,
            specular_reflectance : 1.0,
            shininess            : 40.0,
            edge_contrast        : 0.0,
        }),
        
        u_lighting: new THREE.Uniform
        ({
            intensity          : 1.0,                         // overall light intensity
            shadows            : 0.0,                         // threshold for shadow casting
            ambient_color      : new THREE.Color(0xffffff),   // ambient light color
            diffuse_color      : new THREE.Color(0xffffff),   // diffuse light color
            specular_color     : new THREE.Color(0xffffff),   // specular light color
            position_offset    : new THREE.Vector3(),         // offset position for light source
        }),

        u_debugging: new THREE.Uniform
        ({
            option    : 0,
            variable1 : 0,
            variable2 : 0,
            variable3 : 0,
        }),
    }

    const defines = 
    {           
        INTERSECT_BBOX_ENABLED : 1,
        SKIPPING_ENABLED       : 1,

        STATS_ENABLED          : 1,
        DEBUG_ENABLED          : 1,
        DISCARDING_DISABLED    : 0,

        MAX_CELL_COUNT         : 1000,
        MAX_BLOCK_COUNT        : 1000,
        MAX_CELL_SUB_COUNT     : 10,
        MAX_BLOCK_SUB_COUNT    : 20,
        MAX_BATCH_COUNT        : 100,
    }

    const material = new THREE.ShaderMaterial
    ({    
        side: THREE.BackSide,
        transparent: false,
        depthTest: true,
        depthWrite: true,

        glslVersion: THREE.GLSL3,
        uniforms: uniforms,
        defines: defines,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    })

    return material
}