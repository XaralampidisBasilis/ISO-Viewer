
/**
 * Calculates the gradient and the smoothed sample at a given position in 
 * a 3D texture using trilinear interpolation sobel operator and smoothing
 * https://github.com/neurolabusc/blog/blob/main/GL-gradients/README.md
 *
 * @param volume_data: 3D texture sampler containing intensity data.
 * @param volume_dimensions: Dimensions of the 3D texture.
 *
 * @return vec4: Gradient vector at the given position as rgb and smoothed sample as alpha
 */

// Sample neighbors
const vec2 center_offset_ = vec2(-0.5, 0.5);
const vec3 center_offsets_[8] = vec3[8]
(
    center_offset_.xxx, center_offset_.yxx, 
    center_offset_.xyx, center_offset_.xxy, 
    center_offset_.xyy, center_offset_.yxy,
    center_offset_.yyx, center_offset_.yyy 
);

float samples[8];
for (int i = 0; i < 8; i++)
{
    samples[i] = sample_intensity_map(trace.position + center_offsets_[i]);
}

vec3 forward = vec3(
    samples[1] + samples[5] + samples[6] + samples[7], // x-axis
    samples[2] + samples[4] + samples[6] + samples[7], // y-axis
    samples[3] + samples[4] + samples[5] + samples[7]  // z-axis
);

vec3 backward = vec3(
    samples[0] + samples[3] + samples[2] + samples[4], // x-axis
    samples[0] + samples[3] + samples[1] + samples[5], // y-axis
    samples[0] + samples[2] + samples[1] + samples[6]  // z-axis
);

// Compute gradient
trace.gradient = (forward - backward) / (u_intensity_map.spacing * 4.0);

// Update stats
#if STATS_ENABLED == 1
stats.num_fetches += 8;
#endif