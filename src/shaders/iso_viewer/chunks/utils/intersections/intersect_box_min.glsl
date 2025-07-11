// Ray-AABB (Axis Aligned Bounding Box) intersection.
// Mathematics: https://tavianator.com/2022/ray_box_boundary.html

#ifndef INTERSECT_BOX_MIN
#define INTERSECT_BOX_MIN

#ifndef MMAX
#include "../math/mmax"
#endif
#ifndef ARGMAX
#include "../math/argmax"
#endif

float intersect_box_min(vec3 box_min, vec3 box_max, vec3 start, vec3 inv_dir) 
{
    vec3 t_min_tmp = (box_min - start) * inv_dir;
    vec3 t_max_tmp = (box_max - start) * inv_dir;
    vec3 t_min = min(t_min_tmp, t_max_tmp);
    float t_entry = mmax(t_min);
    return t_entry;
}


float intersect_box_min(vec3 box_min, vec3 box_max, vec3 start, vec3 inv_dir, out int axis) 
{
    vec3 t_min_tmp = (box_min - start) * inv_dir;
    vec3 t_max_tmp = (box_max - start) * inv_dir;
    vec3 t_min = min(t_min_tmp, t_max_tmp);
    float t_entry = mmax(t_min);
    axis = argmax(t_min);
    return t_entry;
}

float intersect_box_min(vec3 box_min, vec3 box_max, vec3 start, vec3 inv_dir, out ivec3 face) 
{
    vec3 t_min_tmp = (box_min - start) * inv_dir;
    vec3 t_max_tmp = (box_max - start) * inv_dir;
    vec3 t_min = min(t_min_tmp, t_max_tmp);
    float t_entry = mmax(t_min);
    face = ivec3(equal(t_min, vec3(t_entry)));
    return t_entry;
}

#endif // INTERSECT_BOX_MIN