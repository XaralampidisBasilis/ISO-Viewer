
// Share common information between cells
poly.fxx_fyy_fzz_f[0] = poly.fxx_fyy_fzz_f[3];

// Compute samples at the remaining 3 equidistant locations
poly.f0_f1_f2_f3.x = poly.f0_f1_f2_f3.w;
poly.f0_f1_f2_f3.y = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[1]), poly.fxx_fyy_fzz_f[1], poly.gxx_gyy_gzz[0]);
poly.f0_f1_f2_f3.z = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[2]), poly.fxx_fyy_fzz_f[2], poly.gxx_gyy_gzz[1]);
poly.f0_f1_f2_f3.w = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[3]), poly.fxx_fyy_fzz_f[3], poly.gxx_gyy_gzz[2]);

// Construct the trilinear cubic coefficients
// and the quadratic correction coefficients
mat4 fxx_fyy_fzz_f = transpose(poly.fxx_fyy_fzz_f);
mat3 gxx_gyy_gzz = transpose(poly.gxx_gyy_gzz);

mat3x4 A =
outerProduct(fxx_fyy_fzz_f[0], gxx_gyy_gzz[0]) +
outerProduct(fxx_fyy_fzz_f[1], gxx_gyy_gzz[1]) +
outerProduct(fxx_fyy_fzz_f[2], gxx_gyy_gzz[2]);
mat3x4 B = A * poly.inv_vander3;  
B[0] += fxx_fyy_fzz_f[3];
mat3x4 C = poly.inv_transp_vander4 * B;

poly.coeffs[0] = C[0][0];
poly.coeffs[1] = C[0][1] + C[1][0];
poly.coeffs[2] = C[0][2] + C[1][1] + C[2][0];
poly.coeffs[3] = C[0][3] + C[1][2] + C[2][1];
poly.coeffs[4] = C[1][3] + C[2][2];
poly.coeffs[5] = C[2][3];

// compute quintic intersection
// compute sign crossings for degenerate cases
vec4 r = poly.f0_f1_f2_f3 - u_rendering.intensity;
vec4 t = poly.t0_t1_t2_t3;
poly.coeffs[0] -= u_rendering.intensity;

cell.intersected = is_quintic_solvable(poly.coeffs, t.xw, r.xw)
|| (r.x < 0.0) != (r.y < 0.0) 
|| (r.y < 0.0) != (r.z < 0.0) 
|| (r.z < 0.0) != (r.w < 0.0);


// mat3x4 A =
// outerProduct(vec4(poly.fxx_fyy_fzz_f[0].x, poly.fxx_fyy_fzz_f[1].x, poly.fxx_fyy_fzz_f[2].x, poly.fxx_fyy_fzz_f[3].x), vec3(poly.gxx_gyy_gzz[0].x, poly.gxx_gyy_gzz[1].x, poly.gxx_gyy_gzz[2].x)) +
// outerProduct(vec4(poly.fxx_fyy_fzz_f[0].y, poly.fxx_fyy_fzz_f[1].y, poly.fxx_fyy_fzz_f[2].y, poly.fxx_fyy_fzz_f[3].y), vec3(poly.gxx_gyy_gzz[0].y, poly.gxx_gyy_gzz[1].y, poly.gxx_gyy_gzz[2].y)) +
// outerProduct(vec4(poly.fxx_fyy_fzz_f[0].z, poly.fxx_fyy_fzz_f[1].z, poly.fxx_fyy_fzz_f[2].z, poly.fxx_fyy_fzz_f[3].z), vec3(poly.gxx_gyy_gzz[0].z, poly.gxx_gyy_gzz[1].z, poly.gxx_gyy_gzz[2].z));

// mat3x4 B = A * poly.inv_vander3;  
// B[0] += vec4(poly.fxx_fyy_fzz_f[0].w, poly.fxx_fyy_fzz_f[1].w, poly.fxx_fyy_fzz_f[2].w, poly.fxx_fyy_fzz_f[3].w);
