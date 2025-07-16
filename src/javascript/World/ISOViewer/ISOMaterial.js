import * as THREE from 'three'
import { colormapLocations } from '../../../../static/textures/colormaps/colormaps.js'
import vertexShader from '../../../shaders/iso_viewer/vertex.glsl'
import fragmentShader from '../../../shaders/iso_viewer/fragment.glsl'

export default function()
{
    const uniforms = 
    {
        u_volume: new THREE.Uniform
        ({
            dimensions    : new THREE.Vector3(),
            inv_dimensions: new THREE.Vector3(),
            spacing       : new THREE.Vector3(),
            blocks        : new THREE.Vector3(),
            stride        : 0,
        }),

        u_textures: new THREE.Uniform
        ({
            color_maps    : null,
            intensity_map : null,
            trilaplacian_intensity_map : null,
            occupancy_map : null,
            isotropic_distance_map  : null,
            anisotropic_distance_map : null,
            extended_distance_map : null,
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
        }),

        u_bbox : new THREE.Uniform
        ({
            min_cell_coords : new THREE.Vector3(),
            max_cell_coords : new THREE.Vector3(),
            min_block_coords: new THREE.Vector3(),
            max_block_coords: new THREE.Vector3(),
            min_position    : new THREE.Vector3(),
            max_position    : new THREE.Vector3(),
        }),

        u_distance_map : new THREE.Uniform
        ({
            max_distance    : 0,
            max_iterations  : 31,
            stride          : 4,
            dimensions      : new THREE.Vector3(),
            spacing         : new THREE.Vector3(),
            size            : new THREE.Vector3(),
            inv_stride      : 1/4,
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
            intensity : 0.69,
            max_groups : 0,
            max_cells : 0,
            max_blocks: 0,
        }),

        u_shading: new THREE.Uniform
        ({
            ambient_reflectance  : 0.2,
            diffuse_reflectance  : 1.0,
            specular_reflectance : 0.6,
            shininess            : 40.0,
            edge_contrast        : 0.4,
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
            variable4 : 0,
            variable5 : 0,
        }),
    }

    const defines = 
    {           
        INTERSECT_BBOX_ENABLED: 0,
        INTERSECT_BVOL_ENABLED: 0,
        BERNSTEIN_SKIP_ENABLED: 0,
        APPROXIMATION_ENABLED : 0,
        VARIATION_ENABLED     : 0,
        SKIPPING_ENABLED      : 1,

        INTERPOLATION_METHOD : 0,
        INTERSECTION_METHOD : 1,
        HYBRID_METHOD : 0,
        SKIPPING_METHOD : 3,

        STATS_ENABLED          : 1,
        DEBUG_ENABLED          : 1,
        DISCARDING_DISABLED    : 0,

        MAX_CELLS           : 1000,
        MAX_BLOCKS          : 1000,
        MAX_GROUPS          : 100,
        MAX_CELLS_PER_BLOCK : 10,
        MAX_BLOCKS_PER_GROUP: 20,
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