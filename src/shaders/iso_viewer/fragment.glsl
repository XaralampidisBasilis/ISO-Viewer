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
#if OCCUPANCY_VIEW == 1
#include "./chunks/functions/positionToBlockCoords"
#include "./chunks/functions/block_dda"
#include "./chunks/functions/compute_octant"
#include "./chunks/functions/sample_distance/sample_occupancy"
#else
#include "./chunks/functions/functions"
#endif
#if OCCUPANCY_VIEW == 1 || OCCUPANCY_WIREFRAME == 1
#include "./chunks/occupancy/intersect_occupied_bounds"
#endif
#if OCCUPANCY_WIREFRAME == 1
#include "./chunks/functions/block_dda"
#include "./chunks/functions/sample_distance/sample_occupancy"
#include "./chunks/occupancy/occupancy_wireframe"
#endif
#if WRITE_SURFACE_DEPTH == 1
in vec2 v_proxy_clip_zw;
flat in vec2 v_camera_clip_zw;

void writeRayDepth(float distance)
{
    // The hit lies on the camera-to-proxy ray. Interpolate in clip space before dividing by w.
    vec2 clip_zw = mix(v_camera_clip_zw, v_proxy_clip_zw, distance / length(v_ray_direction));
    gl_FragDepth = clip_zw.y > 0.0 ? clamp(0.5 + 0.5 * clip_zw.x / clip_zw.y, 0.0, 1.0) : 0.0;
}
#endif

void main() 
{
    #if WRITE_SURFACE_DEPTH == 1
    gl_FragDepth = 1.0;
    #endif
    #if OCCUPANCY_VIEW == 1
    #include "./chunks/occupancy/compute_occupancy_view"
    #else
    #include "./chunks/structs/set_structs"
    #include "./chunks/raycast/compute_raycast"
    #if OCCUPANCY_WIREFRAME == 1
    vec3 direction_dx = dFdx(ray.direction);
    vec3 direction_dy = dFdy(ray.direction);
    if (ray.span_distance > 0.0)
    {
    #elif DISCARDING_ENABLED == 1
    if (ray.span_distance <= 0.0) discard;
    #endif

    #include "./chunks/march/compute_march"
    #if OCCUPANCY_WIREFRAME == 1
    }
    else hit.discarded = true;

    const vec3 wire_color = vec3(0.26, 0.88, 0.80);
    float extent = hit.discarded ? box.exit_distance : hit.distance;
    float wire_alpha = 0.62 * occupancyWireframe(extent, direction_dx, direction_dy);
    if (hit.discarded || SURFACE_VISIBLE == 0)
    {
        if (wire_alpha <= 0.0) discard;
        fragColor = vec4(wire_color, wire_alpha);
        return;
    }
    #elif DISCARDING_ENABLED == 1
    if (hit.discarded) discard;
    #endif

    #include "./chunks/shade/compute_shade"

    #if WRITE_SURFACE_DEPTH == 1
    if (!hit.discarded) writeRayDepth(hit.distance);
    #endif

    #if OCCUPANCY_WIREFRAME == 1
    fragColor.rgb = mix(fragColor.rgb, wire_color, wire_alpha);
    #endif

    #if DEBUG_ENABLED == 1
    #include "./chunks/debug/compute_debug"
    #endif

    #if DEBUG_ENABLED == 1 && DISCARDING_ENABLED == 1
    fragColor.a *= hit.discarded ? 0.0 : 1.0;
    #endif
    #endif
}
