#ifndef UNIFORMS_TEXTURES
#define UNIFORMS_TEXTURES

struct UniformsTextures 
{
    sampler2D colormaps;      
    sampler3D trilinear_volume;
    sampler3D tricubic_volume;
    usampler3D occupancy;
    usampler3D isotropic_distance;
    usampler3D anisotropic_distance;
    usampler3D extended_distance;
};

uniform UniformsTextures u_textures;

#endif