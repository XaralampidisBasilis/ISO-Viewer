#ifndef UNIFORMS_LIGHTING
#define UNIFORMS_LIGHTING

struct UniformsLighting 
{
    float intensity;          
    float shadows;            
    vec3  color_ambient;      
    vec3  color_diffuse;      
    vec3  color_specular;     
    vec3  position_offset;    
};

uniform UniformsLighting u_lighting;

#endif
