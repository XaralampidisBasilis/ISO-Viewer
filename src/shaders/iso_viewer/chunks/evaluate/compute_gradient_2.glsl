
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
vec2 offset = vec2(-1.0, 1.0) * delta;
vec3 scale = normalize(u_intensity_map.spacing);

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

// compute average samples
x_samples /= 4.0;
y_samples /= 4.0;
z_samples /= 4.0;

// first order partial derivatives
vec3 gradient = vec3(
    x_samples.y - x_samples.x,
    y_samples.y - y_samples.x,
    z_samples.y - z_samples.x
);

gradient /= delta * 2.0;

// Scale derivatives to physical space
gradient /= scale;

// Update trace
trace.gradient = gradient;
