
vec3 p0 = mix(cell.entry_position, cell.exit_position, poly.points[1]);
vec3 p1 = mix(cell.entry_position, cell.exit_position, poly.points[2]);
vec3 p2 = mix(cell.entry_position, cell.exit_position, poly.points[3]);
vec3 g0 = fract(p0 - 0.5);
vec3 g1 = fract(p1 - 0.5);
vec3 g2 = fract(p2 - 0.5);
g0 = g0 * (g0 - 1.0) * 0.5;
g1 = g1 * (g1 - 1.0) * 0.5;
g2 = g2 * (g2 - 1.0) * 0.5;

mat4x3 gx_gy_gz_g = mat4x3(
    g0.x, g1.x, g2.x,
    g0.y, g1.y, g2.y,
    g0.z, g1.z, g2.z,
    1.0,  1.0,  1.0
);

poly.fxx_fyy_fzz_f[0] = poly.fxx_fyy_fzz_f[3];
poly.fxx_fyy_fzz_f[1] = texture(u_textures.trilaplacian_intensity_map, u_intensity_map.inv_dimensions * p0);
poly.fxx_fyy_fzz_f[2] = texture(u_textures.trilaplacian_intensity_map, u_intensity_map.inv_dimensions * p1);
poly.fxx_fyy_fzz_f[3] = texture(u_textures.trilaplacian_intensity_map, u_intensity_map.inv_dimensions * p2);

// Construct the trilinear cubic coefficients
// and the quadratic correction coefficients
mat4x3 Errors = gx_gy_gz_g * poly.fxx_fyy_fzz_f;
Errors -= u_rendering.intensity;

// Compute errors
poly.errors[0] = poly.errors[3];
poly.errors[1] = Errors[1][0];
poly.errors[2] = Errors[2][1];
poly.errors[3] = Errors[3][2];

// Compute coefficients
#if BERNSTEIN_SKIP_ENABLED == 0

    mat4x3 C = poly.inv_vander3 * Errors * poly.inv_vander4;
    
    sum_anti_diags(C, poly.coeffs);

    // compute quintic intersection and sign crossings for degenerate cases
    cell.intersected = is_quintic_solvable(poly.coeffs, poly.points.xw, poly.errors.xw) || sign_change(poly.errors);

#else

    // Compute berstein coefficients matrix
    mat4x3 B = matrixCompMult(poly.bernstein3 * Errors * poly.bernstein4, poly.bernstein34);

    // Compute berstein coefficients
    sum_anti_diags(B, poly.bcoeffs);

    float min_value = mmin(poly.bcoeffs);
    float max_value = mmax(poly.bcoeffs);

    // Compute sign change in berstein coefficients
    if (sign_change(min_value, max_value))
    {
        // Compute quintic intersection
        mat4x3 C = poly.inv_vander3 * Errors * poly.inv_vander4;

        sum_anti_diags(C, poly.coeffs);

        float max_residue = abs(poly.coeffs[4]) + abs(poly.coeffs[5]);
        float max_envelope = max(abs(min_value), abs(max_value));   
        float ratio = max_residue / max_envelope;

        debug.variable2 = to_color(max_envelope);
        debug.variable3 = to_color(max_residue);
        debug.variable4 = to_color(ratio);
        debug.variable5.xyz += float(ratio < (u_debugging.variable5 * 2.0)) / 10.0;
        debug.variable6.xyz += 1.0 / 10.0;

        if (ratio < u_debugging.variable5 * 3.0)
        {
            // Compute cubic intersection 
            vec4 c = poly.errors * poly.inv_vander4;

            // poly.coeffs = float[6](c[0], c[1], c[2], c[3], 0.0, 0.0);
            cell.intersected = is_cubic_solvable(c, poly.points.xw, poly.errors.xw);
        }
        else
        {
            // compute sign crossings for quintic intersection       
            cell.intersected = poly_sign_change(poly.coeffs);
        }

        // Compute sign crossings for degenerate cases
        cell.intersected = cell.intersected || sign_change(poly.errors);
    }

#endif


#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif


