#ifndef UNIFORMS_RENDERING
#define UNIFORMS_RENDERING

struct Rendering 
{
    float iso_intensity;      
    int   max_cell_count;     
    int   max_block_count;   
};

uniform Rendering u_rendering;

#endif // UNIFORMS_RENDERING