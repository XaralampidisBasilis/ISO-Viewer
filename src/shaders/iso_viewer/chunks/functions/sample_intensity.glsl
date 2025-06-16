
// float sample_intensity(in vec3 coords)
// {
//     #if STATS_ENABLED == 1
//     stats.num_fetches += 1;
//     #endif
    
//     vec3 uvw = coords * u_intensity_map.inv_dimensions;

//     return texture(u_textures.intensity_map, uvw).r;
// }

float sample_intensity(in vec3 coords)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif
    
    vec3 uvw = coords * u_intensity_map.inv_dimensions;

    return texture(u_textures.trilaplacian_intensity_map, uvw).a;
}


