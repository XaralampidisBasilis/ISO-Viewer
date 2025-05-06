
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

float samples[20] = float[20]
(
    // trilinear differences
    sample_intensity_map(trace.position + offset.xxx),
    sample_intensity_map(trace.position + offset.zxx),
    sample_intensity_map(trace.position + offset.xzx),
    sample_intensity_map(trace.position + offset.xxz),
    sample_intensity_map(trace.position + offset.xzz),
    sample_intensity_map(trace.position + offset.zxz),
    sample_intensity_map(trace.position + offset.zzx),
    sample_intensity_map(trace.position + offset.zzz),

    // central differences
    sample_intensity_map(trace.position + offset.yyy),
    sample_intensity_map(trace.position + offset.xyy),
    sample_intensity_map(trace.position + offset.zyy),
    sample_intensity_map(trace.position + offset.yxy),
    sample_intensity_map(trace.position + offset.yzy),
    sample_intensity_map(trace.position + offset.yyx),
    sample_intensity_map(trace.position + offset.yyz),
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

vec2 xy_samples = vec2(
    samples[1] + samples[2] + samples[4] + samples[5],
    samples[0] + samples[3] + samples[6] + samples[7]
);

vec2 xz_samples = vec2(
    samples[1] + samples[3] + samples[4] + samples[6],
    samples[0] + samples[2] + samples[5] + samples[7]
);

vec2 yz_samples = vec2(
    samples[2] + samples[3] + samples[5] + samples[6],
    samples[0] + samples[1] + samples[4] + samples[7]
);

// first order partial derivatives
vec3 gradient;
gradient[0] = (x_samples.y - x_samples.x) / 2.0; 
gradient[1] = (y_samples.y - y_samples.x) / 2.0; 
gradient[2] = (z_samples.y - z_samples.x) / 2.0; 

mat3 hessian;
// principal second order partial derivatives
hessian[0][0] = x_samples.x + x_samples.y - samples[8] * 2.0;
hessian[1][1] = y_samples.x + y_samples.y - samples[8] * 2.0;
hessian[2][2] = z_samples.x + z_samples.y - samples[8] * 2.0;

// mixed second order partial derivatives
hessian[0][1] = (xy_samples.y - xy_samples.x) / 4.0;
hessian[0][2] = (xz_samples.y - xz_samples.x) / 4.0;
hessian[1][2] = (yz_samples.y - yz_samples.x) / 4.0;

// symmetry of mixed second order partial derivatives
hessian[1][0] = hessian[0][1];
hessian[2][0] = hessian[0][2];
hessian[2][1] = hessian[1][2];

// Scale derivatives
vec3 scale = u_intensity_map.spacing * delta;
hessian /= outerProduct(scale, scale);
gradient /= scale;

// Compute mean curvature
float a = length(gradient);
float a2 = a * a;
float a3 = a2 * a;
float b = dot(gradient * hessian, gradient);
float c = hessian[0][0] + hessian[1][1] + hessian[2][2];
float curvature = (b - a2 * c) / (a3 * 2.0);

// Update trace
trace.intensity = samples[8];
trace.gradient = gradient;
trace.curvature = curvature;
trace.error = trace.intensity - u_rendering.intensity;
