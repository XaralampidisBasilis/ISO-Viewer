
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
float delta = 0.5 + u_debugging.variable1;
vec3 offset = vec3(-1.0, 0.0, 1.0) * delta;

float samples[9] = float[9]
(
    sample_intensity_map(trace.position + offset.xxx), // (-, -, -) [ 0] 
    sample_intensity_map(trace.position + offset.zxx), // (+, -, -) [ 1] 
    sample_intensity_map(trace.position + offset.xzx), // (-, +, -) [ 2] 
    sample_intensity_map(trace.position + offset.xxz), // (-, -, +) [ 3] 
    sample_intensity_map(trace.position + offset.xzz), // (-, +, +) [ 4] 
    sample_intensity_map(trace.position + offset.zxz), // (+, -, +) [ 5] 
    sample_intensity_map(trace.position + offset.zzx), // (+, +, -) [ 6] 
    sample_intensity_map(trace.position + offset.zzz), // (+, +, +) [ 7] 
    sample_intensity_map(trace.position + offset.yyy)  // (0, 0, 0) [ 8] 
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

// average samples
x_samples  *= 0.25;
y_samples  *= 0.25;
z_samples  *= 0.25;
xy_samples *= 0.25;
xz_samples *= 0.25;
yz_samples *= 0.25;

// first order partial derivatives with sobel8
vec3 gradient;
gradient[0] = x_samples.y - x_samples.x; 
gradient[1] = y_samples.y - y_samples.x; 
gradient[2] = z_samples.y - z_samples.x; 

mat3 hessian;
// pure second order partial derivatives with central differences
hessian[0][0] = x_samples.y + x_samples.x - samples[8] * 2.0;
hessian[1][1] = y_samples.y + y_samples.x - samples[8] * 2.0;
hessian[2][2] = z_samples.y + z_samples.x - samples[8] * 2.0;

// mixed second order partial derivatives with sobel8
hessian[0][1] = xy_samples.y - xy_samples.x;
hessian[0][2] = xz_samples.y - xz_samples.x;
hessian[1][2] = yz_samples.y - yz_samples.x;

// symmetric mixed second order partial derivatives
hessian[1][0] = hessian[0][1];
hessian[2][0] = hessian[0][2];
hessian[2][1] = hessian[1][2];

// Scale derivatives
vec3 scale = normalize(u_intensity_map.spacing);
vec3 spacing = scale * delta;
gradient /= spacing * 2.0;
hessian /= outerProduct(spacing, spacing);
laplacian /= dot(spacing, spacing);

// Compute mean curvature
float A = length(gradient);
float A2 = A * A;
float A3 = A2 * A;
float Q = dot(gradient * hessian, gradient);
float L = hessian[0][0] + hessian[1][1] + hessian[2][2];
float curvature = (Q - A2 * L) / (A3 * 2.0);

// Update trace
trace.gradient = gradient;
trace.curvature = curvature;
