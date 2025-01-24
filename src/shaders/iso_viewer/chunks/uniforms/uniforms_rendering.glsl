#ifndef UNIFORMS_RENDERING
#define UNIFORMS_RENDERING

struct Rendering 
{
    float iso_intensity;      
    int   max_step_count;     
    int   max_skip_count;   
};

uniform Rendering u_rendering;

#endif // UNIFORMS_RENDERING