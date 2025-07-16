#ifndef UNIFORMS_VOLUME
#define UNIFORMS_VOLUME

struct Volume 
{
    ivec3 dimensions;    
    vec3  inv_dimensions;    
    vec3  spacing;           
    int   block_stride;
    ivec3 block_counts;                         
};

uniform Volume u_volume;

#endif
