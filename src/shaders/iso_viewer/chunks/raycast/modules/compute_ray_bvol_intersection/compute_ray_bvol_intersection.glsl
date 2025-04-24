
#include "./intersect_forward"
#include "./intersect_backward"

if (ray.start_distance < ray.end_distance)
{
    ray.span_distance = ray.end_distance - ray.start_distance;
}
else
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #else
    ray.discarded = true;
    #endif
}