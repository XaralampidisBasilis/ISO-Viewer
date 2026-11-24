#ifndef INTERSECTION_BOX_BOUNDS
#define INTERSECTION_BOX_BOUNDS

#ifndef MMAX
#include "../math/mmax"
#endif

// Signed distance to the box and unsigned distance to its farthest corner.
vec2 intersection_box_bounds(vec3 boxMin, vec3 boxMax, vec3 point)
{
    vec3 center = 0.5 * (boxMin + boxMax);
    vec3 halfExtent = 0.5 * (boxMax - boxMin);
    vec3 offset = abs(point - center);
    vec3 q = offset - halfExtent;
    float minDistance = length(max(q, 0.0)) + min(mmax(q), 0.0);
    float maxDistance = length(offset + halfExtent);
    return vec2(minDistance, maxDistance);
}

#endif // BOX_BOUNDS
