
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
float delta = 0.5;
vec3 offset = vec3(-1.0, 0.0, 1.0) * delta;

float samples[8] = float[8]
(
    sample_intensity_map(trace.position + offset.xxx),
    sample_intensity_map(trace.position + offset.zxx),
    sample_intensity_map(trace.position + offset.xzx),
    sample_intensity_map(trace.position + offset.xxz),
    sample_intensity_map(trace.position + offset.xzz),
    sample_intensity_map(trace.position + offset.zxz),
    sample_intensity_map(trace.position + offset.zzx),
    sample_intensity_map(trace.position + offset.zzz),
);

vec2 x_samples = vec2(
    samples[0] + samples[2] + samples[3] + samples[4],
    samples[1] + samples[5] + samples[6] + samples[7]
);

vec2 y_samples = vec2(
    samples[0] + samples[1] + samples[3] + samples[5],
    samples[2] + samples[4] + samples[6] + samples[7]
);

vec2 z_samples = vec2(
    samples[0] + samples[1] + samples[2] + samples[6],
    samples[3] + samples[4] + samples[5] + samples[7]
);

// first order partial derivatives
vec3 gradient;
gradient[0] = (x_samples.y - x_samples.x) / 8.0; 
gradient[1] = (y_samples.y - y_samples.x) / 8.0; 
gradient[2] = (z_samples.y - z_samples.x) / 8.0; 

// Scale derivatives
vec3 scale = u_intensity_map.spacing * delta;
gradient /= scale;

// Update trace
trace.gradient = gradient;
