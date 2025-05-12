
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
float delta0 = 0.5;
float delta1 = 1.0;
vec2 offset0 = vec2(-1.0, 1.0) * delta0;
vec3 offset1 = vec3(-1.0, 0.0, 1.0) * delta1;

float samples[15] = float[15]
(
    // trilinear differences
    sample_intensity_map(trace.position + offset0.xxx), // (-, -, -) [ 0] 
    sample_intensity_map(trace.position + offset0.yxx), // (+, -, -) [ 1] 
    sample_intensity_map(trace.position + offset0.xyx), // (-, +, -) [ 2] 
    sample_intensity_map(trace.position + offset0.xxy), // (-, -, +) [ 3] 
    sample_intensity_map(trace.position + offset0.xyy), // (-, +, +) [ 4] 
    sample_intensity_map(trace.position + offset0.yxy), // (+, -, +) [ 5] 
    sample_intensity_map(trace.position + offset0.yyx), // (+, +, -) [ 6] 
    sample_intensity_map(trace.position + offset0.yyy), // (+, +, +) [ 7] 
 
    // central differences 
    sample_intensity_map(trace.position + offset1.xyy), // (-, 0, 0) [ 8] 
    sample_intensity_map(trace.position + offset1.zyy), // (+, 0, 0) [ 9] 
    sample_intensity_map(trace.position + offset1.yxy), // (0, -, 0) [10] 
    sample_intensity_map(trace.position + offset1.yzy), // (0, +, 0) [11] 
    sample_intensity_map(trace.position + offset1.yyx), // (0, 0, -) [12] 
    sample_intensity_map(trace.position + offset1.yyz), // (0, 0, +) [13] 
    sample_intensity_map(trace.position + offset1.yyy)  // (0, 0, 0) [14] 
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

// first order partial derivatives with approximate sobel
surface.gradient[0] = (samples[ 9] - samples[ 8]) / 8.0; 
surface.gradient[1] = (samples[11] - samples[10]) / 8.0; 
surface.gradient[2] = (samples[13] - samples[12]) / 8.0; 

// pure second order partial derivatives with central differences
surface.hessian[0][0] = samples[ 8] + samples[ 9] - samples[14] * 2.0;
surface.hessian[1][1] = samples[10] + samples[11] - samples[14] * 2.0;
surface.hessian[2][2] = samples[12] + samples[13] - samples[14] * 2.0;

// mixed second order partial derivatives with sobel8
surface.hessian[0][1] = (xy_samples.x - xy_samples.y) / 4.0;
surface.hessian[0][2] = (xz_samples.x - xz_samples.y) / 4.0;
surface.hessian[1][2] = (yz_samples.x - yz_samples.y) / 4.0;

// symmetric mixed second order partial derivatives
surface.hessian[1][0] = surface.hessian[0][1];
surface.hessian[2][0] = surface.hessian[0][2];
surface.hessian[2][1] = surface.hessian[1][2];

// Scale derivatives
vec3 scale = normalize(u_intensity_map.spacing);
vec3 spacing0 = scale * delta0;
vec3 spacing1 = scale * delta1;
surface.gradient /= spacing0;
surface.hessian /= outerProduct(spacing1, spacing1);

// Compute curvatures
surface.curvatures = principal_curvatures(surface.gradient, surface.hessian, surface.curvients);
surface.curvatures *= ssign(dot(surface.gradient, camera.position - trace.position));
surface.curvients *= ssign(dot(surface.gradient, camera.position - trace.position));

// Special curvatures
surface.mean_curvature = mean(surface.curvatures);
surface.gauss_curvature = prod(surface.curvatures);
surface.max_curvature = maxabs(surface.curvatures);

// Update trace
trace.gradient = surface.gradient;
trace.curvature = (surface.curvatures.x + surface.curvatures.y) * 0.5;

// debug.variable2 = to_color(vec3(surface.hessian[0][0], surface.hessian[1][1], surface.hessian[2][2]) * 0.5 + 0.5);
// debug.variable3 = to_color(vec3(surface.hessian[1][2], surface.hessian[0][2], surface.hessian[0][1]) * 0.5 + 0.5);

debug.variable2 = to_color(normalize(surface.curvients[0]) * 0.5 + 0.5);
debug.variable3 = to_color(normalize(surface.curvients[1]) * 0.5 + 0.5);

// debug.variable2 = to_color(mmix(COLOR.CYAN, COLOR.BLACK, COLOR.MAGENTA, map(-2.0, 2.0, surface.mean_curvature)));
// debug.variable3 = to_color(mmix(COLOR.CYAN, COLOR.BLACK, COLOR.MAGENTA, map(-2.0, 2.0, surface.max_curvature)));
