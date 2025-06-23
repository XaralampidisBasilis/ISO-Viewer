

// Share common information between cells
poly.fxx_fyy_fzz_f[0] = poly.fxx_fyy_fzz_f[3];

// Compute samples at the remaining 3 equidistant locations
poly.f0_f1_f2_f3.x = poly.f0_f1_f2_f3.w;
poly.f0_f1_f2_f3.y = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[1]), poly.fxx_fyy_fzz_f[1], poly.gxx_gyy_gzz[0]);
poly.f0_f1_f2_f3.z = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[2]), poly.fxx_fyy_fzz_f[2], poly.gxx_gyy_gzz[1]);
poly.f0_f1_f2_f3.w = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[3]), poly.fxx_fyy_fzz_f[3], poly.gxx_gyy_gzz[2]);

// Construct the trilinear cubic coefficients
// and the quadratic correction coefficients
mat3 qxx_qyy_qzz = transpose(poly.gxx_gyy_gzz * poly.inv_vander3);
mat4 cxx_cyy_czz_c = transpose(poly.fxx_fyy_fzz_f * poly.inv_vander4);

// Combine all the coefficients to reconstruct the quintic
// Start from the trilinear interpolation coefficients
poly.coeffs[0] = cxx_cyy_czz_c[3].x;
poly.coeffs[1] = cxx_cyy_czz_c[3].y;
poly.coeffs[2] = cxx_cyy_czz_c[3].z;
poly.coeffs[3] = cxx_cyy_czz_c[3].w;
poly.coeffs[4] = 0.0;
poly.coeffs[5] = 0.0;

// Reconstruct and add the quintic correction coefficients 
#pragma unroll
for (int i = 0; i < 3; ++i)
{
    vec4 c = cxx_cyy_czz_c[i];
    vec3 q = qxx_qyy_qzz[i];

    poly.coeffs[0] += c.x * q.x;
    poly.coeffs[1] += c.x * q.y + c.y * q.x;
    poly.coeffs[2] += c.x * q.z + c.y * q.y + c.z * q.x;
    poly.coeffs[3] += c.y * q.z + c.z * q.y + c.w * q.x;
    poly.coeffs[4] += c.z * q.z + c.w * q.y;
    poly.coeffs[5] += c.w * q.z;
}

// compute quintic intersection
// compute sign crossings for degenerate cases
vec4 f = poly.f0_f1_f2_f3 - u_rendering.intensity;
vec4 t = poly.t0_t1_t2_t3;
poly.coeffs[0] -= u_rendering.intensity;

cell.intersected = is_quintic_solvable(poly.coeffs, t.xw, f.xw)
|| (f.x < 0.0) != (f.y < 0.0) 
|| (f.y < 0.0) != (f.z < 0.0) 
|| (f.z < 0.0) != (f.w < 0.0);
