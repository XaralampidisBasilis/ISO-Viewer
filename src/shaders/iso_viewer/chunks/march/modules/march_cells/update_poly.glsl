
vec3 p1 = mix(cell.entry_position, cell.exit_position, poly.points[1]);
vec3 p2 = mix(cell.entry_position, cell.exit_position, poly.points[2]);
vec3 p3 = mix(cell.entry_position, cell.exit_position, poly.points[3]);

vec3 g1 = quadratic_bias(p1);
vec3 g2 = quadratic_bias(p2);
vec3 g3 = quadratic_bias(p3);

poly.gx_gy_gz_g[0] = vec3(g1.x, g2.x, g3.x);
poly.gx_gy_gz_g[1] = vec3(g1.y, g2.y, g3.y);
poly.gx_gy_gz_g[2] = vec3(g1.z, g2.z, g3.z);

poly.fxx_fyy_fzz_f[0] = poly.fxx_fyy_fzz_f[3];
poly.fxx_fyy_fzz_f[1] = texture(u_textures.trilaplacian_intensity_map, u_volume.inv_dimensions * p1);
poly.fxx_fyy_fzz_f[2] = texture(u_textures.trilaplacian_intensity_map, u_volume.inv_dimensions * p2);
poly.fxx_fyy_fzz_f[3] = texture(u_textures.trilaplacian_intensity_map, u_volume.inv_dimensions * p3);

// Construct the trilinear cubic coefficients
// and the quadratic correction coefficients
mat4x3 temp_residuals = poly.gx_gy_gz_g * poly.fxx_fyy_fzz_f - u_rendering.intensity;

#if BERNSTEIN_SKIP_ENABLED == 0
// Compute quintic coefficient matrix
mat4x3 temp_coeffs = poly.inv_vander3 * temp_residuals * poly.inv_vander4;

// Compute quintic coefficient from the sum of anti diagonals 
sum_anti_diags(temp_coeffs, poly.coeffs);

// Compute quintic intersection with sign changes
cell.intersected = eval_poly_sign_change(poly.coeffs);

#if STATS_ENABLED == 1
stats.num_checks += 1;
#endif

#else
// Compute berstein coefficients matrix
mat4x3 bcoeffs_mat = matrixCompMult(poly.bernstein3 * temp_residuals * poly.bernstein4, poly.bernstein34);

// Compute berstein coefficients
sum_anti_diags(bcoeffs_mat, poly.bcoeffs);

// Compute sign change in berstein coefficients
if (sign_change(poly.bcoeffs))
{
    // Compute quintic coefficient matrix
    mat4x3 temp_coeffs = poly.inv_vander3 * temp_residuals * poly.inv_vander4;

    // Compute quintic coefficient from the sum of anti diagonals 
    sum_anti_diags(temp_coeffs, poly.coeffs);

    // Compute quintic intersection with sign changes
    cell.intersected = eval_poly_sign_change(poly.coeffs);

    #if STATS_ENABLED == 1
    stats.num_checks += 1;
    #endif
}

#endif

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif


