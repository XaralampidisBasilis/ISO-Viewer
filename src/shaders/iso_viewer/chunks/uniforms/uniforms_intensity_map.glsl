#ifndef UNIFORMS_INTENSITY_MAP
#define UNIFORMS_INTENSITY_MAP

struct IntensityMap 
{
    ivec3 dimensions;    
    vec3  spacing;           
    vec3  inv_dimensions;                         
};

uniform IntensityMap u_intensity_map;

#endif
