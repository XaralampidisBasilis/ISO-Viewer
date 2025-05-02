
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
vec2 offset = vec2(-1.0, 1.0) * 0.5;

float samples[8] = float[8](
    sample_intensity_map(trace.position + offset.xxx),
    sample_intensity_map(trace.position + offset.yxx),
    sample_intensity_map(trace.position + offset.xyx),
    sample_intensity_map(trace.position + offset.xxy),
    sample_intensity_map(trace.position + offset.xyy),
    sample_intensity_map(trace.position + offset.yxy),
    sample_intensity_map(trace.position + offset.yyx),
    sample_intensity_map(trace.position + offset.yyy)
);

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

vec3 delta = u_intensity_map.spacing * 4.0;

// Compute gradient
trace.gradient = (forward - backward) / delta;

