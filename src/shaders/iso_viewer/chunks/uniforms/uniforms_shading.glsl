#ifndef UNIFORMS_SHADING
#define UNIFORMS_SHADING

struct UniformsShading
{
    float reflect_ambient; 
    float reflect_diffuse; 
    float reflect_specular;
    float shininess;           
    float edge_contrast;       
};

uniform UniformsShading u_shading;

#endif 
