
float sample_intensity_map(in vec3 pos)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif
    
    return texture(u_textures.intensity_map, pos * u_intensity_map.inv_dimensions).r;
}
