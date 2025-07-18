
vec3 p1 = mix(cell.entry_position, cell.exit_position, quintic.points[1]);
vec3 p2 = mix(cell.entry_position, cell.exit_position, quintic.points[2]);
vec3 p3 = mix(cell.entry_position, cell.exit_position, quintic.points[3]);

vec3 g1 = quadratic_bias(p1);
vec3 g2 = quadratic_bias(p2);
vec3 g3 = quadratic_bias(p3);

quintic.gx_gy_gz_g[0] = vec3(g1.x, g2.x, g3.x);
quintic.gx_gy_gz_g[1] = vec3(g1.y, g2.y, g3.y);
quintic.gx_gy_gz_g[2] = vec3(g1.z, g2.z, g3.z);

quintic.fxx_fyy_fzz_f[0] = quintic.fxx_fyy_fzz_f[3];
quintic.fxx_fyy_fzz_f[1] = texture(u_textures.tricubic_volume, u_volume.inv_dimensions * p1);
quintic.fxx_fyy_fzz_f[2] = texture(u_textures.tricubic_volume, u_volume.inv_dimensions * p2);
quintic.fxx_fyy_fzz_f[3] = texture(u_textures.tricubic_volume, u_volume.inv_dimensions * p3);

// Construct the trilinear cubic coefficients
mat4x3 residuals_mat = quintic.gx_gy_gz_g * quintic.fxx_fyy_fzz_f - u_rendering.intensity;

// Compute berstein coefficients matrix
mat4x3 bcoeffs_mat = matrixCompMult(quintic_bernstein3 * residuals_mat * quintic_bernstein4, quintic_bernstein34);

// Compute berstein coefficients
sum_anti_diags(bcoeffs_mat, quintic.bcoeffs);

// Compute sign change in berstein coefficients
if (sign_change(quintic.bcoeffs))
{
    // Compute quintic coefficient matrix
    mat4x3 coeffs_mat = quintic_inv_vander3 * residuals_mat * quintic_inv_vander4;

    // Compute quintic coefficient from the sum of anti diagonals 
    sum_anti_diags(coeffs_mat, quintic.coeffs);

    // Compute quintic intersection with sign changes
    cell.intersected = eval_poly_sign_change(quintic.coeffs);

    #if STATS_ENABLED == 1
    stats.num_tests += 1;
    #endif
}

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif


