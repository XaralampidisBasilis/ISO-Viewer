#ifndef UNIFORMS_TEXTURES
#define UNIFORMS_TEXTURES

struct Textures 
{
    sampler2D color_maps;      
    sampler3D intensity_map;
    isampler3D distance_map;
    // isampler3D anisotropic_distance_map;
    isampler3D ext_anisotropic_distance_map;
};

uniform Textures u_textures;

#endif