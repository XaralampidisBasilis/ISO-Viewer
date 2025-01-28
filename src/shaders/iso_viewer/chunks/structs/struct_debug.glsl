#ifndef STRUCT_DEBUG
#define STRUCT_DEBUG

struct Debug 
{
    int  slot_ray;
    vec4 ray_discarded;
    vec4 ray_direction;
    vec4 ray_step_distance;
    vec4 ray_start_distance;
    vec4 ray_end_distance;
    vec4 ray_span_distance;
    vec4 ray_start_position;
    vec4 ray_end_position;
    vec4 ray_max_cell_count;
    vec4 ray_max_block_count;

    int  slot_trace;
    vec4 trace_intersected;      
    vec4 trace_terminated;       
    vec4 trace_exhausted;        
    vec4 trace_outside;  
    vec4 trace_distance;         
    vec4 trace_position;         
    vec4 trace_intensity;        
    vec4 trace_error;            
    vec4 trace_abs_error;        
    vec4 trace_gradient;         
    vec4 trace_gradient_length;  

    int  slot_cell;
    vec4 cell_intersected;       
    vec4 cell_terminated;        
    vec4 cell_coords;            
    vec4 cell_coords_step;       
    vec4 cell_max_position;      
    vec4 cell_min_position;      
    vec4 cell_entry_distance;    
    vec4 cell_exit_distance;     
    vec4 cell_sample_distances;  
    vec4 cell_sample_intensities;
    vec4 cell_intensity_coeffs;  

    int  slot_block;
    vec4 block_value;        
    vec4 block_occupied;     
    vec4 block_coords;       
    vec4 block_coords_step;  
    vec4 block_min_position; 
    vec4 block_max_position; 
    vec4 block_skip_count;   

    int  slot_frag;
    vec4 frag_depth;
    vec4 frag_position; 
    vec4 frag_normal_vector; 
    vec4 frag_view_vector;
    vec4 frag_light_vector; 
    vec4 frag_halfway_vector; 
    vec4 frag_view_angle;
    vec4 frag_light_angle; 
    vec4 frag_halfway_angle; 
    vec4 frag_camera_angle; 
    vec4 frag_mapped_intensity; 
    vec4 frag_mapped_color; 
    vec4 frag_ambient_color; 
    vec4 frag_diffuse_color; 
    vec4 frag_specular_color; 
    vec4 frag_shaded_color; 
    vec4 frag_shaded_luminance; 

    int  slot_box;
    vec4 box_entry_distance;
    vec4 box_exit_distance;
    vec4 box_span_distance;
    vec4 box_entry_position;
    vec4 box_exit_position;
    vec4 box_min_entry_distance;
    vec4 box_max_exit_distance;
    vec4 box_max_span_distance;

    int  slot_camera;
    vec4 camera_position;
    vec4 camera_direction; 
    vec4 camera_far_distance; 
    vec4 camera_near_distance; 

    int  slot_stats;
    vec4 stats_num_fetches;
    vec4 stats_num_steps;
    vec4 stats_num_skips;

    int  slot_variables;
    vec4 variable1;
    vec4 variable2;
    vec4 variable3;
};

Debug set_debug()
{
    Debug debug;

    debug.ray_discarded            = vec4(vec3(0.0), 1.0);
    debug.ray_direction            = vec4(vec3(0.0), 1.0);
    debug.ray_step_distance        = vec4(vec3(0.0), 1.0);
    debug.ray_start_distance       = vec4(vec3(0.0), 1.0);
    debug.ray_end_distance         = vec4(vec3(0.0), 1.0);
    debug.ray_span_distance        = vec4(vec3(0.0), 1.0);
    debug.ray_start_position       = vec4(vec3(0.0), 1.0);
    debug.ray_end_position         = vec4(vec3(0.0), 1.0);
    debug.ray_max_cell_count       = vec4(vec3(0.0), 1.0);
    debug.ray_max_block_count       = vec4(vec3(0.0), 1.0);

    debug.trace_intersected        = vec4(vec3(0.0), 1.0);
    debug.trace_terminated         = vec4(vec3(0.0), 1.0);
    debug.trace_exhausted          = vec4(vec3(0.0), 1.0);
    debug.trace_outside            = vec4(vec3(0.0), 1.0);
    debug.trace_distance           = vec4(vec3(0.0), 1.0);
    debug.trace_position           = vec4(vec3(0.0), 1.0);
    debug.trace_intensity          = vec4(vec3(0.0), 1.0);
    debug.trace_error              = vec4(vec3(0.0), 1.0);
    debug.trace_abs_error          = vec4(vec3(0.0), 1.0);
    debug.trace_gradient           = vec4(vec3(0.0), 1.0);
    debug.trace_gradient_length    = vec4(vec3(0.0), 1.0);
 
    debug.cell_intersected         = vec4(vec3(0.0), 1.0);
    debug.cell_terminated          = vec4(vec3(0.0), 1.0);
    debug.cell_coords              = vec4(vec3(0.0), 1.0);
    debug.cell_coords_step         = vec4(vec3(0.0), 1.0);
    debug.cell_max_position        = vec4(vec3(0.0), 1.0);
    debug.cell_min_position        = vec4(vec3(0.0), 1.0);
    debug.cell_entry_distance      = vec4(vec3(0.0), 1.0);
    debug.cell_exit_distance       = vec4(vec3(0.0), 1.0);
    debug.cell_sample_distances    = vec4(vec3(0.0), 1.0);
    debug.cell_sample_intensities  = vec4(vec3(0.0), 1.0);
    debug.cell_intensity_coeffs    = vec4(vec3(0.0), 1.0);

    debug.block_value              = vec4(vec3(0.0), 1.0);
    debug.block_occupied           = vec4(vec3(0.0), 1.0);
    debug.block_coords             = vec4(vec3(0.0), 1.0);
    debug.block_coords_step        = vec4(vec3(0.0), 1.0);
    debug.block_min_position       = vec4(vec3(0.0), 1.0);
    debug.block_max_position       = vec4(vec3(0.0), 1.0);
    debug.block_skip_count         = vec4(vec3(0.0), 1.0);

    debug.frag_depth               = vec4(vec3(0.0), 1.0);
    debug.frag_position            = vec4(vec3(0.0), 1.0);
    debug.frag_normal_vector       = vec4(vec3(0.0), 1.0);
    debug.frag_view_vector         = vec4(vec3(0.0), 1.0);
    debug.frag_light_vector        = vec4(vec3(0.0), 1.0);
    debug.frag_halfway_vector      = vec4(vec3(0.0), 1.0);
    debug.frag_view_angle          = vec4(vec3(0.0), 1.0);
    debug.frag_light_angle         = vec4(vec3(0.0), 1.0);
    debug.frag_halfway_angle       = vec4(vec3(0.0), 1.0);
    debug.frag_camera_angle        = vec4(vec3(0.0), 1.0);
    debug.frag_mapped_intensity    = vec4(vec3(0.0), 1.0);
    debug.frag_mapped_color        = vec4(vec3(0.0), 1.0);
    debug.frag_ambient_color       = vec4(vec3(0.0), 1.0);
    debug.frag_diffuse_color       = vec4(vec3(0.0), 1.0);
    debug.frag_specular_color      = vec4(vec3(0.0), 1.0);
    debug.frag_shaded_color        = vec4(vec3(0.0), 1.0);
    debug.frag_shaded_luminance    = vec4(vec3(0.0), 1.0);
    
    debug.box_entry_distance       = vec4(vec3(0.0), 1.0);
    debug.box_exit_distance        = vec4(vec3(0.0), 1.0);
    debug.box_span_distance        = vec4(vec3(0.0), 1.0);
    debug.box_entry_position       = vec4(vec3(0.0), 1.0);
    debug.box_exit_position        = vec4(vec3(0.0), 1.0);
    debug.box_min_entry_distance   = vec4(vec3(0.0), 1.0);
    debug.box_max_exit_distance    = vec4(vec3(0.0), 1.0);
    debug.box_max_span_distance    = vec4(vec3(0.0), 1.0);

    debug.camera_position          = vec4(vec3(0.0), 1.0);
    debug.camera_direction         = vec4(vec3(0.0), 1.0);
    debug.camera_far_distance      = vec4(vec3(0.0), 1.0);
    debug.camera_near_distance     = vec4(vec3(0.0), 1.0);

    debug.stats_num_fetches        = vec4(vec3(0.0), 1.0);
    debug.stats_num_steps          = vec4(vec3(0.0), 1.0);
    debug.stats_num_skips          = vec4(vec3(0.0), 1.0);

    debug.variable1                = vec4(vec3(0.0), 1.0);
    debug.variable2                = vec4(vec3(0.0), 1.0);
    debug.variable3                = vec4(vec3(0.0), 1.0);

    return debug;
}

#endif // STRUCT_DEBUG