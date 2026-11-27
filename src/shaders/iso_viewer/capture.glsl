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
#include "./chunks/capture/capture_ray"

void main()
{
    #include "./chunks/structs/set_structs"
    #include "./chunks/raycast/compute_raycast"

    if (ray.span_distance > 0.0)
    {
        #include "./chunks/march/compute_march"
    }
    else
    {
        hit.discarded = true;
        hit.position = camera.position;
    }

    int column = int(gl_FragCoord.x);
    int row = int(gl_FragCoord.y);
    if (column == 0)
    {
        if (row == 0) fragColor = vec4(camera.position, ray.start_distance);
        else if (row == 1) fragColor = vec4(ray.direction, ray.end_distance);
        else fragColor = vec4(hit.position, ray.span_distance <= 0.0 ? -1.0 : float(!hit.discarded));
    }
    else if (column == 1)
    {
        fragColor = vec4(float(capture_count), 0.0, 0.0, 0.0);
    }
    else
    {
        if (row == 0) fragColor = capture_min;
        else if (row == 1) fragColor = capture_max;
        else fragColor = capture_exit;
    }
}
