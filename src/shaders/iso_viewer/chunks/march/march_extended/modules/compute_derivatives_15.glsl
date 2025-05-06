
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
vec3 scale = normalize(u_intensity_map.spacing);
float delta = 0.5;
float delta2 = delta * 2.0;
vec2 offset2 = delta * vec2(-1.0, 1.0);
vec3 offset3 = delta2 * vec3(-1.0, 0.0, 1.0);
vec3 spacing = scale * delta;
vec3 spacing2 = scale * delta2;

float samples[15] = float[15]
(
    // trilinear differences
    sample_intensity_map(trace.position + offset2.xxx), // (-, -, -) [ 0] 
    sample_intensity_map(trace.position + offset2.yxx), // (+, -, -) [ 1] 
    sample_intensity_map(trace.position + offset2.xyx), // (-, +, -) [ 2] 
    sample_intensity_map(trace.position + offset2.xxy), // (-, -, +) [ 3] 
    sample_intensity_map(trace.position + offset2.xyy), // (-, +, +) [ 4] 
    sample_intensity_map(trace.position + offset2.yxy), // (+, -, +) [ 5] 
    sample_intensity_map(trace.position + offset2.yyx), // (+, +, -) [ 6] 
    sample_intensity_map(trace.position + offset2.yyy), // (+, +, +) [ 7] 
 
    // central differences 
    sample_intensity_map(trace.position + offset3.xyy), // (-, 0, 0) [ 8] 
    sample_intensity_map(trace.position + offset3.zyy), // (+, 0, 0) [ 9] 
    sample_intensity_map(trace.position + offset3.yxy), // (0, -, 0) [10] 
    sample_intensity_map(trace.position + offset3.yzy), // (0, +, 0) [11] 
    sample_intensity_map(trace.position + offset3.yyx), // (0, 0, -) [12] 
    sample_intensity_map(trace.position + offset3.yyz), // (0, 0, +) [13] 
    sample_intensity_map(trace.position + offset3.yyy)  // (0, 0, 0) [14] 
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
hessian[0][0] = samples[ 8] + samples[ 9] - samples[14] * 2.0;
hessian[1][1] = samples[10] + samples[11] - samples[14] * 2.0;
hessian[2][2] = samples[12] + samples[13] - samples[14] * 2.0;

// mixed second order partial derivatives with sobel8
hessian[0][1] = xy_samples.y - xy_samples.x;
hessian[0][2] = xz_samples.y - xz_samples.x;
hessian[1][2] = yz_samples.y - yz_samples.x;

// symmetric mixed second order partial derivatives
hessian[1][0] = hessian[0][1];
hessian[2][0] = hessian[0][2];
hessian[2][1] = hessian[1][2];

// Scale derivatives
gradient /= spacing2;
hessian /= outerProduct(spacing2, spacing2);

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
