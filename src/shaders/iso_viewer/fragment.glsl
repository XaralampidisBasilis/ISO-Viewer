precision highp sampler3D;
precision highp sampler2D;
precision highp float;
precision highp int;

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
    #include "./chunks/structs/set_structs"
    #include "./chunks/raycast/compute_raycast"
    #include "./chunks/march/compute_march"
    #include "./chunks/shade/compute_shade"

    #if DEBUG_ENABLED == 1
    #include "./chunks/debug/compute_debug"
    #endif
}
