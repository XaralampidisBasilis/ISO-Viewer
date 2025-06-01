#ifndef UNIFORMS_TEXTURES
#define UNIFORMS_TEXTURES

struct Textures 
{
    sampler2D color_maps;      
    sampler3D intensity_map;
    sampler3D trilaplacian_intensity_map;
    usampler3D occupancy_map;
    usampler3D distance_map;
    usampler3D anisotropic_distance_map;
    usampler3D extended_anisotropic_distance_map;
};

uniform Textures u_textures;

#endif