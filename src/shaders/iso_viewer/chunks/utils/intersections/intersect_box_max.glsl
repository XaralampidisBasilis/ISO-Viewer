// Ray-AABB (Axis Aligned Bounding Box) intersection.
// Mathematics: https://tavianator.com/2022/ray_box_boundary.html
// https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection.html

#ifndef INTERSECT_BOX_MAX
#define INTERSECT_BOX_MAX

#ifndef MILLI_TOLERANCE
#define MILLI_TOLERANCE 1e-3
#endif
#ifndef MMIN
#include "../math/mmin"
#endif
#ifndef ARGMIN
#include "../math/argmin"
#endif

float intersect_box_max(vec3 box_min, vec3 box_max, vec3 ray_origin, vec3 inv_ray_dir) 
{
    vec3 b_min = (box_min - ray_origin) * inv_ray_dir;
    vec3 b_max = (box_max - ray_origin) * inv_ray_dir;
    vec3 t_max = max(b_min, b_max);
    float t_exit = mmin(t_max);
    return t_exit;
}

float intersect_box_max(vec3 box_min, vec3 box_max, vec3 ray_origin, vec3 inv_ray_dir, out int axis) 
{
    vec3 b_min = (box_min - ray_origin) * inv_ray_dir;
    vec3 b_max = (box_max - ray_origin) * inv_ray_dir;
    vec3 t_max = max(b_min, b_max);
    float t_exit = mmin(t_max);
    axis = argmin(t_max);
    return t_exit;
}

float intersect_box_max(vec3 box_min, vec3 box_max, vec3 ray_origin, vec3 inv_ray_dir, out ivec3 face) 
{
    vec3 b_min = (box_min - ray_origin) * inv_ray_dir;
    vec3 b_max = (box_max - ray_origin) * inv_ray_dir;
    vec3 t_max = max(b_min, b_max);
    float t_exit = mmin(t_max);
    face = ivec3(equal(t_max, vec3(t_exit)));
    return t_exit;
}

#endif // INTERSECT_BOX_MAX