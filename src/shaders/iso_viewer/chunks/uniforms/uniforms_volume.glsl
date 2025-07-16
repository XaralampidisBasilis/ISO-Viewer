#ifndef UNIFORMS_VOLUME
#define UNIFORMS_VOLUME

struct Volume 
{
    ivec3 dimensions;    
    vec3  inv_dimensions;    
    vec3  spacing;           
    int   stride;
    ivec3 blocks;                         
};

uniform Volume u_volume;

#endif
