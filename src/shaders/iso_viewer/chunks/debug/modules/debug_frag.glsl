// COMPUTE DEBUG 

// depth
vec4 debug_frag_depth = to_color(frag.depth);

// position
vec4 debug_frag_position = to_color(frag.position.xyz);

// normal vector
vec4 debug_frag_normal_vector = to_color(frag.normal_vector * 0.5 + 0.5);

// view vector
vec4 debug_frag_view_vector = to_color(frag.view_vector * 0.5 + 0.5);

// light vector
vec4 debug_frag_light_vector = to_color(frag.light_vector * 0.5 + 0.5);

// halfway vector
vec4 debug_frag_halfway_vector = to_color(frag.halfway_vector * 0.5 + 0.5);

// view angle
vec4 debug_frag_view_angle = to_color(map(-1.0, 1.0, frag.view_angle));

// light angle
vec4 debug_frag_light_angle = to_color(map(-1.0, 1.0, frag.light_angle));

// halfway angle
vec4 debug_frag_halfway_angle = to_color(map(-1.0, 1.0, frag.halfway_angle));

// camera angle
vec4 debug_frag_camera_angle = to_color(acos(frag.camera_angle) / MATH.PI);

// mapped color
vec4 debug_frag_material_color = to_color(frag.material_color);

// ambient color
vec4 debug_frag_ambient_color = to_color(frag.ambient_color);

// diffuse color
vec4 debug_frag_diffuse_color = to_color(frag.diffuse_color);

// specular color
vec4 debug_frag_specular_color = to_color(frag.specular_color);

// direct color
vec4 debug_frag_direct_color = to_color(frag.direct_color);

// shaded color
vec4 debug_frag_color = to_color(frag.color);

// shaded luminance
vec4 debug_frag_shaded_luminance = to_color(dot(frag.color, vec3(0.2126, 0.7152, 0.0722)));

// edge factor
vec4 debug_frag_edge_factor = to_color(frag.edge_factor);

// gradient factor
vec4 debug_frag_gradient_factor = to_color(frag.gradient_factor);

// PRINT DEBUG

switch (u_debugging.option - 500)
{
    case  1: fragColor = debug_frag_depth;              break; 
    case  2: fragColor = debug_frag_position;           break; 
    case  3: fragColor = debug_frag_normal_vector;      break; 
    case  4: fragColor = debug_frag_view_vector;        break; 
    case  5: fragColor = debug_frag_light_vector;       break; 
    case  6: fragColor = debug_frag_halfway_vector;     break; 
    case  7: fragColor = debug_frag_view_angle;         break; 
    case  8: fragColor = debug_frag_light_angle;        break; 
    case  9: fragColor = debug_frag_halfway_angle;      break; 
    case 10: fragColor = debug_frag_camera_angle;       break; 
    case 11: fragColor = debug_frag_material_color;     break; 
    case 12: fragColor = debug_frag_ambient_color;      break; 
    case 13: fragColor = debug_frag_diffuse_color;      break; 
    case 14: fragColor = debug_frag_specular_color;     break; 
    case 15: fragColor = debug_frag_direct_color;       break; 
    case 16: fragColor = debug_frag_color;              break; 
    case 17: fragColor = debug_frag_shaded_luminance;   break; 
    case 18: fragColor = debug_frag_edge_factor;        break; 
    case 19: fragColor = debug_frag_gradient_factor;    break; 
}   