#ifndef UNIFORMS_SHADING
#define UNIFORMS_SHADING

struct UniformsShading
{
    float ambient_reflectance; 
    float diffuse_reflectance; 
    float specular_reflectance;
    float shininess;           
    float edge_contrast;       
};

uniform UniformsShading u_shading;

#endif 
