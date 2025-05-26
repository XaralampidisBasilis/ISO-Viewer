
in vec3 v_position;
in vec3 v_camera_position;
in vec3 v_camera_direction;
in vec3 v_ray_direction;
in mat4 v_clip_space_matrix;

out vec4 fragColor;

#include "./chunks/utils"
#include "./chunks/uniforms/uniforms"
#include "./chunks/structs/structs"
#include "./chunks/functions/functions"

void main() 
{
    
    bvec4 test[8];
    test_quartic4_residue(test);

    debug.variable0 = to_color(vec3(any(test[0]), all(test[0]), 0.0));
    debug.variable1 = to_color(vec3(any(test[1]), all(test[1]), 0.0));
    debug.variable2 = to_color(vec3(any(test[2]), all(test[2]), 0.0));
    debug.variable3 = to_color(vec3(any(test[3]), all(test[3]), 0.0));
    debug.variable4 = to_color(vec3(any(test[4]), all(test[4]), 0.0));
    debug.variable5 = to_color(vec3(any(test[5]), all(test[5]), 0.0));
    debug.variable6 = to_color(vec3(any(test[6]), all(test[6]), 0.0));
    debug.variable7 = to_color(vec3(any(test[7]), all(test[7]), 0.0));

    // #include "./chunks/structs/set_structs"
    // #include "./chunks/raycast/compute_raycast"
    // #include "./chunks/march/compute_march"
    // #include "./chunks/shade/compute_shade"

    #if DEBUG_ENABLED == 1
    #include "./chunks/debug/compute_debug"
    #endif
}
