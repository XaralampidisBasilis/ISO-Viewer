
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
const vec3 offset = vec2(-1.0, 0.0, 1.0) * 0.5;
const vec3 kernel = [1.0, -4.0, 1.0];

float samples[20] = float[20]
(
    sample_intensity_map(trace.position + offset.xxx),
    sample_intensity_map(trace.position + offset.zxx),
    sample_intensity_map(trace.position + offset.xzx),
    sample_intensity_map(trace.position + offset.xxz),
    sample_intensity_map(trace.position + offset.xzz),
    sample_intensity_map(trace.position + offset.zxz),
    sample_intensity_map(trace.position + offset.zzx),
    sample_intensity_map(trace.position + offset.zzz),

    sample_intensity_map(trace.position + offset.yxx),
    sample_intensity_map(trace.position + offset.yzx),
    sample_intensity_map(trace.position + offset.yxz),
    sample_intensity_map(trace.position + offset.yzz),

    sample_intensity_map(trace.position + offset.xyx),
    sample_intensity_map(trace.position + offset.zyx),
    sample_intensity_map(trace.position + offset.xyz),
    sample_intensity_map(trace.position + offset.zyz),

    sample_intensity_map(trace.position + offset.xxy),
    sample_intensity_map(trace.position + offset.zxy),
    sample_intensity_map(trace.position + offset.xzy),
    sample_intensity_map(trace.position + offset.zzy),
);

vec3 x_samples = vec3(
    samples[ 0] + samples[ 2] + samples[ 3] + samples[ 4],
    samples[ 8] + samples[ 9] + samples[10] + samples[11],
    samples[ 1] + samples[ 5] + samples[ 6] + samples[ 7]
);

vec3 y_samples = vec3(
    samples[ 0] + samples[ 1] + samples[ 3] + samples[ 5],
    samples[12] + samples[13] + samples[14] + samples[15],
    samples[ 2] + samples[ 4] + samples[ 6] + samples[ 7]
);

vec3 z_samples = vec3(
    samples[ 0] + samples[ 1] + samples[ 2] + samples[ 6],
    samples[16] + samples[17] + samples[18] + samples[19],
    samples[ 3] + samples[ 4] + samples[ 5] + samples[ 7]
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
gradient[0] = x_samples.z - x_samples.x; 
gradient[1] = y_samples.z - y_samples.x; 
gradient[2] = z_samples.z - z_samples.x; 

mat3 hessian;
// principal second order partial derivatives
hessian[0][0] = dot(x_samples, kernel);
hessian[1][1] = dot(y_samples, kernel);
hessian[2][2] = dot(z_samples, kernel);

// mixed second order partial derivatives
hessian[0][1] = xy_samples.y - xy_samples.x;
hessian[0][2] = xz_samples.y - xz_samples.x;
hessian[1][2] = yz_samples.y - yz_samples.x;

// symmetry of mixed second order partial derivatives
hessian[1][0] = hessian[0][1];
hessian[2][0] = hessian[0][2];
hessian[2][1] = hessian[1][2];

// Scale derivatives
gradient = gradient / (u_intensity_map.spacing * 4.0);
