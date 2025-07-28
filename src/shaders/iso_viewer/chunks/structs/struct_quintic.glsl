#ifndef STRUCT_QUINTIC
#define STRUCT_QUINTIC

struct Quintic 
{
    vec4 residuals;
    float coeffs[6];  
    float bernstein_coeffs[6];  
    float roots[6];
    mat4 features;
    mat3x4 biases;
    float root;
    float derivative;
};

Quintic quintic; 

void set_quintic()
{
    quintic.residuals = vec4(0.0);
    quintic.coeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.bernstein_coeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.roots = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.biases = mat3x4(0);
    quintic.features = mat4(0);
    quintic.root = 0.0;
    quintic.derivative = 0.0;
}

#endif 
