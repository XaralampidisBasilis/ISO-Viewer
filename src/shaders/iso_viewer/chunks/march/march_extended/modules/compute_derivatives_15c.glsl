
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
float delta = 0.5 + u_debugging.variable1;
float delta2 = delta + u_debugging.variable2;
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

vec3 x_samples = vec3(
    samples[0] + samples[2] + samples[3] + samples[4],
    samples[1] + samples[5] + samples[6] + samples[7],
    samples[10] + samples[11] + samples[12] + samples[13]
);

vec3 y_samples = vec3(
    samples[0] + samples[1] + samples[3] + samples[5],
    samples[2] + samples[4] + samples[6] + samples[7],
    samples[8] + samples[9] + samples[12] + samples[13]
);

vec3 z_samples = vec3(
    samples[0] + samples[1] + samples[2] + samples[6],
    samples[3] + samples[4] + samples[5] + samples[7],
    samples[8] + samples[9] + samples[10] + samples[11]
);

vec2 xy_samples = vec2(
    samples[0] + samples[3] + samples[6] + samples[7],
    samples[1] + samples[2] + samples[4] + samples[5]
);

vec2 xz_samples = vec2(
    samples[0] + samples[2] + samples[5] + samples[7],
    samples[1] + samples[3] + samples[4] + samples[6]
);

vec2 yz_samples = vec2(
    samples[0] + samples[1] + samples[4] + samples[7],
    samples[2] + samples[3] + samples[5] + samples[6]
);

vec3 gradient1;
// first order partial derivatives with approximate sobel
gradient1[0] = (samples[ 9] - samples[ 8]) / 2.0; 
gradient1[1] = (samples[11] - samples[10]) / 2.0; 
gradient1[2] = (samples[13] - samples[12]) / 2.0; 

vec3 gradient2;
// first order partial derivatives with central differences
gradient2[0] = (x_samples.y - x_samples.x) / 8.0; 
gradient2[1] = (y_samples.y - y_samples.x) / 8.0; 
gradient2[2] = (z_samples.y - z_samples.x) / 8.0; 

mat3 hessian1;
// pure second order partial derivatives with central differences
hessian1[0][0] = samples[ 8] + samples[ 9] - samples[14] * 2.0;
hessian1[1][1] = samples[10] + samples[11] - samples[14] * 2.0;
hessian1[2][2] = samples[12] + samples[13] - samples[14] * 2.0;

// mixed second order partial derivatives with sobel8
hessian1[0][1] = (xy_samples.x - xy_samples.y) / 4.0;
hessian1[0][2] = (xz_samples.x - xz_samples.y) / 4.0;
hessian1[1][2] = (yz_samples.x - yz_samples.y) / 4.0;

// symmetric mixed second order partial derivatives
hessian1[1][0] = hessian1[0][1];
hessian1[2][0] = hessian1[0][2];
hessian1[2][1] = hessian1[1][2];

mat3 hessian2;
// pure second order partial derivatives with central differences
hessian2[0][0] = (x_samples.x + x_samples.y - x_samples.z * 2.0) / 4.0;
hessian2[1][1] = (y_samples.x + y_samples.y - y_samples.z * 2.0) / 4.0;
hessian2[2][2] = (z_samples.x + z_samples.y - z_samples.z * 2.0) / 4.0;

// mixed second order partial derivatives with sobel8
hessian2[0][1] = (xy_samples.x - xy_samples.y) / 4.0;
hessian2[0][2] = (xz_samples.x - xz_samples.y) / 4.0;
hessian2[1][2] = (yz_samples.x - yz_samples.y) / 4.0;

// symmetric mixed second order partial derivatives
hessian2[1][0] = hessian2[0][1];
hessian2[2][0] = hessian2[0][2];
hessian2[2][1] = hessian2[1][2];

// Mix derivatives
vec3 gradient = mix(gradient1, gradient2, u_debugging.variable3);
mat3 hessian = mmix(hessian1, hessian2, u_debugging.variable4);

// Scale derivatives
gradient /= spacing;
hessian /= outerProduct(spacing2, spacing2);

// Compute mean curvature
vec2 curvatures = principal_curvatures(gradient, hessian);

// Update trace
trace.gradient = gradient;
trace.curvature = (curvatures.x + curvatures.y) * 0.5;
trace.curvature = mmax(curvatures);
