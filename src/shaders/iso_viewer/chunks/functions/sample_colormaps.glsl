#ifndef SAMPLE_COLORMAP
#define SAMPLE_COLORMAP

vec3 sample_colormap(in float x)
{
    // map x value between thresholds
    float s = map(u_colormap.thresholds.x, u_colormap.thresholds.y, x);

    // interpolate the u-coordinate within the colormap texture columns
    vec2 texture_coords = vec2(
        mix(u_colormap.start_coords.x, u_colormap.end_coords.x, s),
        u_colormap.start_coords.y
    );

    return texture(u_textures.colormaps, texture_coords).rgb;
}

#endif