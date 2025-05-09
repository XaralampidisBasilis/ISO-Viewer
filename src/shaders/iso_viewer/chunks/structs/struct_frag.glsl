#ifndef STRUCT_FRAG
#define STRUCT_FRAG

struct Frag 
{
    float depth;             // depth traveled from camera in NDC space
    vec3  position;          // position in NDC space
    vec3  material_color;      // color mapped from the voxel value
    vec3  ambient_color;
    vec3  diffuse_color;
    vec3  specular_color;
    vec3  direct_color;
    vec3  color;           // color after shading has been applied
    vec3  light_vector;    // normalized vector pointing towards light
    vec3  view_vector;     // normalized vector pointing towards camera
    vec3  halfway_vector;  // normalized vector used in specular reflection
    vec3  normal_vector;   // normalized vector defining surface normal
    float light_angle;
    float view_angle;
    float halfway_angle;
    float camera_angle;
    float edge_factor;
    float gradient_factor;
};

Frag frag; // Global mutable struct

void set_frag()
{
    frag.depth           = 0.0;
    frag.position        = vec3(0.0);
    frag.material_color  = vec3(0.0);
    frag.ambient_color   = vec3(0.0);
    frag.diffuse_color   = vec3(0.0);
    frag.specular_color  = vec3(0.0);
    frag.direct_color    = vec3(0.0);
    frag.color           = vec3(0.0);
    frag.light_vector    = vec3(0.0);
    frag.view_vector     = vec3(0.0);
    frag.normal_vector   = vec3(0.0);
    frag.halfway_vector  = vec3(0.0);
    frag.light_angle     = 0.0;
    frag.view_angle      = 0.0;
    frag.halfway_angle   = 0.0;
    frag.camera_angle    = 0.0;
    frag.edge_factor     = 0.0;
    frag.gradient_factor = 0.0;
}

#endif // STRUCT_FRAG
