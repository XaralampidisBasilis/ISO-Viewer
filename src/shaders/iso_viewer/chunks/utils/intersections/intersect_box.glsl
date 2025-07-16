// Ray-AABB (Axis Aligned Bounding Box) intersection.
// Mathematics: https://tavianator.com/2022/ray_box_boundary.html
// box: https://iquilezles.org/articles/intersectors/

#ifndef INTERSECT_BOX
#define INTERSECT_BOX

#ifndef MMIN
#include "../math/mmin"
#endif
#ifndef MMAX
#include "../math/mmax"
#endif
#ifndef ARGMIN
#include "../math/argmin"
#endif
#ifndef ARGMAX
#include "../math/argmax"
#endif

vec2 intersect_box(vec3 box_min, vec3 box_max, vec3 start, vec3 inv_dir) 
{
    vec3 b_min = (box_min - start) * inv_dir;
    vec3 b_max = (box_max - start) * inv_dir;
    float t_entry = mmax(min(b_min, b_max));
    float t_exit  = mmin(max(b_min, b_max));
    return vec2(t_entry, t_exit);
}

vec2 intersect_box(vec3 box_min, vec3 box_max, vec3 start, vec3 inv_dir, out int entry_axis, out int exit_axis) 
{
    vec3 b_min = (box_min - start) * inv_dir;
    vec3 b_max = (box_max - start) * inv_dir;
    vec3 t_min = min(b_min, b_max);
    vec3 t_max = max(b_min, b_max);
    float t_entry = mmax(t_min);
    float t_exit  = mmin(t_max);
    entry_axis = argmax(t_min);
    exit_axis = argmin(t_max);
    return vec2(t_entry, t_exit);
}

vec2 intersect_box(vec3 box_min, vec3 box_max, vec3 start, vec3 inv_dir, out ivec3 entry_face, out ivec3 exit_face) 
{
    vec3 b_min = (box_min - start) * inv_dir;
    vec3 b_max = (box_max - start) * inv_dir;
    vec3 t_min = min(b_min, b_max);
    vec3 t_max = max(b_min, b_max);
    float t_entry = mmax(t_min);
    float t_exit  = mmin(t_max);
    entry_face = ivec3(equal(t_min, vec3(t_entry)));
    exit_face = ivec3(equal(t_max, vec3(t_exit)));
    return vec2(t_entry, t_exit);
}

#endif 