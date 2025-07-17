#ifndef UNIFORMS_LIGHTING
#define UNIFORMS_LIGHTING

struct UniformsLighting 
{
    float intensity;          
    float shadows;            
    vec3  ambient_color;      
    vec3  diffuse_color;      
    vec3  specular_color;     
    vec3  position_offset;    
};

uniform UniformsLighting u_lighting;

#endif
