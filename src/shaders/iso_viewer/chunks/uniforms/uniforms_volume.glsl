#ifndef UNIFORMS_VOLUME
#define UNIFORMS_VOLUME

// struct to hold volume uniforms
struct Volume 
{
    ivec3 dimensions;    
    vec3  spacing;           
    vec3  size;         
    float spacing_length;                
    float size_length;  
    vec3  inv_dimensions;      
    vec3  inv_spacing;   
    vec3  inv_size;            
    vec3  min_position;          
    vec3  max_position;          
    float min_intensity;          
    float max_intensity;          
};

uniform Volume u_volume;

#endif
