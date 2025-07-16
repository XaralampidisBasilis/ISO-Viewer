#ifndef UNIFORMS_DISTANCE_MAP
#define UNIFORMS_DISTANCE_MAP

struct DistanceMap
{
    int   stride;
    ivec3 dimensions;    
};

uniform DistanceMap u_distance_map;

#endif 