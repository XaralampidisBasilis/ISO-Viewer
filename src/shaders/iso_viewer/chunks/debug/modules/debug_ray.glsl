// COMPUTE DEBUG 

// discarded
vec4 debug_ray_discarded = to_color(ray.discarded);

// direction
vec4 debug_ray_direction = to_color(ray.direction * 0.5 + 0.5);

// signs
vec4 debug_ray_signs = to_color(vec3(ray.signs) * 0.5 + 0.5);

// spacing
vec4 debug_ray_spacing = to_color(ray.spacing);

// start distance
vec4 debug_ray_start_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, ray.start_distance));

// end distance
vec4 debug_ray_end_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, ray.end_distance));

// span distance
vec4 debug_ray_span_distance = to_color(map(0.0, box.max_span_distance, ray.span_distance));

// start position
vec4 debug_ray_start_position = to_color(map(box.min_position, box.max_position, ray.start_position));

// end position
vec4 debug_ray_end_position = to_color(map(box.min_position, box.max_position, ray.end_position));


// PRINT DEBUG

switch (u_debug.option - 100)
{
    case  1: fragColor = debug_ray_discarded;       break;
    case  2: fragColor = debug_ray_direction;       break;
    case  3: fragColor = debug_ray_signs;           break;
    case  4: fragColor = debug_ray_spacing;         break;
    case  5: fragColor = debug_ray_start_distance;  break;
    case  6: fragColor = debug_ray_end_distance;    break;
    case  7: fragColor = debug_ray_span_distance;   break;
    case  8: fragColor = debug_ray_start_position;  break;
    case  9: fragColor = debug_ray_end_position;    break;
}