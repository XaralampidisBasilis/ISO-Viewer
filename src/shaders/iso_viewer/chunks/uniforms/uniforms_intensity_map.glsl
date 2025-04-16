#ifndef UNIFORMS_INTENSITY_MAP
#define UNIFORMS_INTENSITY_MAP

struct IntensityMap 
{
    vec3  dimensions;    
    vec3  spacing;           
    vec3  size;         
    float spacing_length;                
    float size_length;  
    vec3  inv_dimensions;      
    vec3  inv_spacing;   
    vec3  inv_size;                    
};

uniform IntensityMap u_intensity_map;

#endif
