

// Share common information between cells
poly.fxx_fyy_fzz_f[0] = poly.fxx_fyy_fzz_f[3];

// Compute samples at the remaining 3 equidistant locations
poly.f0_f1_f2_f3.x = poly.f0_f1_f2_f3.w;
poly.f0_f1_f2_f3.y = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[1]), poly.fxx_fyy_fzz_f[1], poly.gxx_gyy_gzz[0]);
poly.f0_f1_f2_f3.z = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[2]), poly.fxx_fyy_fzz_f[2], poly.gxx_gyy_gzz[1]);
poly.f0_f1_f2_f3.w = sample_trilaplacian_intensity(mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[3]), poly.fxx_fyy_fzz_f[3], poly.gxx_gyy_gzz[2]);

// Construct the trilinear cubic coefficients
// and the quadratic correction coefficients
mat4 axx_ayy_azz_a = transpose(poly.fxx_fyy_fzz_f * poly.inv_vander4);
mat3 bxx_byy_bzz = transpose(poly.gxx_gyy_gzz * poly.inv_vander3);

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

if (abs(poly.coeffs[4]) + abs(poly.coeffs[5]) < 0.01)
{
    debug.variable3.xyz += 1.0 / 100.0;

    cubic.coeffs = vec4(
        poly.coeffs[0],
        poly.coeffs[1],
        poly.coeffs[2],
        poly.coeffs[3]
    );

    cell.intersected = is_cubic_solvable(cubic.coeffs, t.xw, f.xw);
}
else
{
    cell.intersected = is_quintic_solvable(poly.coeffs, t.xw, f.xw)
    || (f.x < 0.0) != (f.y < 0.0) 
    || (f.y < 0.0) != (f.z < 0.0) 
    || (f.z < 0.0) != (f.w < 0.0);
}

// cell.intersected = cell.intersected
