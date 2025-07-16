
vec3 sample_color(in float x)
{
    // map x value between thresholds
    float s = map(u_color_map.thresholds.x, u_color_map.thresholds.y, x);

    // posterize to discrete levels
    float n = posterize(s, float(u_color_map.levels));

    // interpolate the u-coordinate within the colormap texture columns
    float u = mix(u_color_map.start_coords.x, u_color_map.end_coords.x, n);
    float v = u_color_map.start_coords.y;

    // Create the UV coordinates for the texture lookup
    vec2 uv = vec2(u, v);

    return texture(u_textures.color_maps, uv).rgb;
}


