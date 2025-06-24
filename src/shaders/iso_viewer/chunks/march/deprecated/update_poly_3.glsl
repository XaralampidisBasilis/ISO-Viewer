

// #pragma unroll
// for (int i = 0; i < 4; ++i) 
// {
//     vec3 pos = mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[i]);
//     vec4 fxx_fyy_fzz_f = vec4(0.0);
//     vec3 gxx_gyy_gzz = vec3(0.0);

//     poly.f0_f1_f2_f3[i] = sample_trilaplacian_intensity(pos, fxx_fyy_fzz_f, gxx_gyy_gzz);

//     poly.fxx_fyy_fzz_f[0][i] = fxx_fyy_fzz_f[0];
//     poly.fxx_fyy_fzz_f[1][i] = fxx_fyy_fzz_f[1];
//     poly.fxx_fyy_fzz_f[2][i] = fxx_fyy_fzz_f[2];
//     poly.fxx_fyy_fzz_f[3][i] = fxx_fyy_fzz_f[3];

//     if (i > 0)
//     {
//         poly.gxx_gyy_gzz[0][i - 1] = gxx_gyy_gzz[0];
//         poly.gxx_gyy_gzz[1][i - 1] = gxx_gyy_gzz[1];
//         poly.gxx_gyy_gzz[2][i - 1] = gxx_gyy_gzz[2];
//     }
// }



vec4 fxx_fyy_fzz_f; // fxx[n], fyy[n], fzz[n], f[n]
vec3 gxx_gyy_gzz;  // gxx[n], gyy[n], gzz[n]


poly.f0_f1_f2_f3.x = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[0]), fxx_fyy_fzz_f, gxx_gyy_gzz);
poly.fxx_fyy_fzz_f[0][0] = fxx_fyy_fzz_f[0]; // fxx[0]
poly.fxx_fyy_fzz_f[1][0] = fxx_fyy_fzz_f[1]; // fyy[0]
poly.fxx_fyy_fzz_f[2][0] = fxx_fyy_fzz_f[2]; // fzz[0]
poly.fxx_fyy_fzz_f[3][0] = fxx_fyy_fzz_f[3]; // f[0]

poly.f0_f1_f2_f3.y = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[1]), fxx_fyy_fzz_f, gxx_gyy_gzz);
poly.fxx_fyy_fzz_f[0][1] = fxx_fyy_fzz_f[0]; // fxx[1]
poly.fxx_fyy_fzz_f[1][1] = fxx_fyy_fzz_f[1]; // fyy[1]
poly.fxx_fyy_fzz_f[2][1] = fxx_fyy_fzz_f[2]; // fzz[1]
poly.fxx_fyy_fzz_f[3][1] = fxx_fyy_fzz_f[3]; // f[1]
poly.gxx_gyy_gzz[0][0] = gxx_gyy_gzz[0]; // gxx[1]
poly.gxx_gyy_gzz[1][0] = gxx_gyy_gzz[1]; // gyy[1]
poly.gxx_gyy_gzz[2][0] = gxx_gyy_gzz[2]; // gzz[1]

poly.f0_f1_f2_f3.z = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[2]), fxx_fyy_fzz_f, gxx_gyy_gzz);
poly.fxx_fyy_fzz_f[0][2] = fxx_fyy_fzz_f[0]; // fxx[2]
poly.fxx_fyy_fzz_f[1][2] = fxx_fyy_fzz_f[1]; // fyy[2]
poly.fxx_fyy_fzz_f[2][2] = fxx_fyy_fzz_f[2]; // fzz[2]
poly.fxx_fyy_fzz_f[3][2] = fxx_fyy_fzz_f[3]; // f[2]
poly.gxx_gyy_gzz[0][1] = gxx_gyy_gzz[0]; // gxx[2]
poly.gxx_gyy_gzz[1][1] = gxx_gyy_gzz[1]; // gyy[2]
poly.gxx_gyy_gzz[2][1] = gxx_gyy_gzz[2]; // gzz[2]

poly.f0_f1_f2_f3.w = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[3]), fxx_fyy_fzz_f, gxx_gyy_gzz);
poly.fxx_fyy_fzz_f[0][3] = fxx_fyy_fzz_f[0]; // fxx[3]
poly.fxx_fyy_fzz_f[1][3] = fxx_fyy_fzz_f[1]; // fyy[3]
poly.fxx_fyy_fzz_f[2][3] = fxx_fyy_fzz_f[2]; // fzz[3]
poly.fxx_fyy_fzz_f[3][3] = fxx_fyy_fzz_f[3]; // f[3]
poly.gxx_gyy_gzz[0][2] = gxx_gyy_gzz[0]; // gxx[3]
poly.gxx_gyy_gzz[1][2] = gxx_gyy_gzz[1]; // gyy[3]
poly.gxx_gyy_gzz[2][2] = gxx_gyy_gzz[2]; // gzz[3]


// Construct the trilinear cubic coefficients
// and the quadratic correction coefficients
mat4 axx_ayy_azz_a = poly.transp_inv_vander4 * poly.fxx_fyy_fzz_f;
mat3 bxx_byy_bzz = poly.transp_inv_vander3 * poly.gxx_gyy_gzz;

mat3x4 AB = 
outerProduct(axx_ayy_azz_a[0], bxx_byy_bzz[0]) +
outerProduct(axx_ayy_azz_a[1], bxx_byy_bzz[1]) +
outerProduct(axx_ayy_azz_a[2], bxx_byy_bzz[2]);
AB[0] += axx_ayy_azz_a[3];

// Combine all the coefficients to reconstruct the quintic
// Start from the trilinear interpolation coefficients
poly.coeffs[0] = AB[0][0];
poly.coeffs[1] = AB[0][1] + AB[1][0];
poly.coeffs[2] = AB[0][2] + AB[1][1] + AB[2][0];
poly.coeffs[3] = AB[0][3] + AB[1][2] + AB[2][1];
poly.coeffs[4] = AB[1][3] + AB[2][2];
poly.coeffs[5] = AB[2][3];

// compute quintic intersection
// compute sign crossings for degenerate cases
vec4 f = poly.f0_f1_f2_f3 - u_rendering.intensity;
vec4 t = poly.t0_t1_t2_t3;
poly.coeffs[0] -= u_rendering.intensity;

cell.intersected = is_quintic_solvable(poly.coeffs, t.xw, f.xw)
|| (f.x < 0.0) != (f.y < 0.0) 
|| (f.y < 0.0) != (f.z < 0.0) 
|| (f.z < 0.0) != (f.w < 0.0);


