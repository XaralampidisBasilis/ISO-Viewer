precision highp float;
precision highp int;

in vec3 v_position;
in vec3 v_camera_position;
in vec3 v_camera_direction;
in vec3 v_ray_direction;

out vec4 fragColor;

#include "./chunks/utils/utils"
#include "./chunks/constants/constants"
#include "./chunks/uniforms/uniforms"
#include "./chunks/structs/structs"
#include "./chunks/functions/functions"

void main() 
{
    #include "./chunks/structs/set_structs"
    #include "./chunks/raycast/compute_raycast"
    #if DEBUG_ENABLED == 0 && DISCARDING_ENABLED == 1
    if (ray.span_distance <= 0.0) discard;
    #endif

    #include "./chunks/march/compute_march"
    #if DEBUG_ENABLED == 0 && DISCARDING_ENABLED == 1
    if (hit.discarded) discard;
    #endif

    #include "./chunks/shade/compute_shade"

    #if DEBUG_ENABLED == 1
    #include "./chunks/debug/compute_debug"
    #endif

    #if DEBUG_ENABLED == 1 && DISCARDING_ENABLED == 1
    fragColor.a *= hit.discarded ? 0.0 : 1.0;
    #endif
}
