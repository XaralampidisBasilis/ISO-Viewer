#ifndef STRUCT_SURFACE
#define STRUCT_SURFACE

// struct to hold information about the surface at the intersection point
struct Surface 
{
    float orientation;
    vec3 gradient;     
    vec3 normal;
    mat3 hessian;
    float laplacian;
    float steepness;
    vec2 curvatures;   
    mat2x3 curvients;  
    float mean_curvature;
    float gauss_curvature;
    float max_curvature;
    float soft_curvature;
};

Surface surface; // Global mutable struct

void set_surface()
{
    surface.orientation     = 0.0;
    surface.gradient        = vec3(0.0);
    surface.normal          = vec3(0.0);
    surface.hessian         = mat3(0.0);
    surface.laplacian       = 0.0;
    surface.steepness       = 0.0;
    surface.curvatures      = vec2(0.0);
    surface.curvients       = mat2x3(0.0);
    surface.mean_curvature  = 0.0;
    surface.gauss_curvature = 0.0;
    surface.max_curvature   = 0.0;
    surface.soft_curvature  = 0.0;
}

#endif // STRUCT_SURFACE
