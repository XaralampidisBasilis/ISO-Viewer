
vec3 p1 = mix(cell.entry_position, cell.exit_position, poly.points[1]);
vec3 p2 = mix(cell.entry_position, cell.exit_position, poly.points[2]);
vec3 p3 = mix(cell.entry_position, cell.exit_position, poly.points[3]);
vec3 g1 = fract(p1 - 0.5);
vec3 g2 = fract(p2 - 0.5);
vec3 g3 = fract(p3 - 0.5);
g1 = g1 * (g1 - 1.0) * 0.5;
g2 = g2 * (g2 - 1.0) * 0.5;
g3 = g3 * (g3 - 1.0) * 0.5;

mat4x3 gx_gy_gz_g = mat4x3(
    g1.x, g2.x, g3.x,
    g1.y, g2.y, g3.y,
    g1.z, g2.z, g3.z,
    1.0,  1.0,  1.0
);

poly.fxx_fyy_fzz_f[0] = poly.fxx_fyy_fzz_f[3];
poly.fxx_fyy_fzz_f[1] = texture(u_textures.trilaplacian_intensity_map, u_intensity_map.inv_dimensions * p1);
poly.fxx_fyy_fzz_f[2] = texture(u_textures.trilaplacian_intensity_map, u_intensity_map.inv_dimensions * p2);
poly.fxx_fyy_fzz_f[3] = texture(u_textures.trilaplacian_intensity_map, u_intensity_map.inv_dimensions * p3);

// Construct the trilinear cubic coefficients
// and the quadratic correction coefficients
mat4x3 values_mat = gx_gy_gz_g * poly.fxx_fyy_fzz_f;
values_mat -= u_rendering.intensity;

#if BERNSTEIN_SKIP_ENABLED == 0

    // Compute quintic coefficient matrix
    mat4x3 coeffs_mat = poly.inv_vander3 * values_mat * poly.inv_vander4;
    
    // Compute quintic coefficient from the sum of anti diagonals 
    sum_anti_diags(coeffs_mat, poly.coeffs);

    #if APPROXIMATION_ENABLED == 0

        // Compute quintic intersection with sign changes
        cell.intersected = poly_sign_change(poly.coeffs);

    #else
        // Compute quintic to cubic maximum residue
        float max_residue = max(
            abs(poly.coeffs[4] * 0.2), 
            abs(poly.coeffs[4] + poly.coeffs[5])
        );

        // If residue is low we can approximate with cubic
        if (max_residue < TOLERANCE.MILLI)
        {
            // Compute values
            poly.values = vec4(poly.coeffs[0], values_mat[1][0], values_mat[2][1], values_mat[3][2]);

            // Compute cubic coefficients
            vec4 coeffs = poly.values * poly.inv_vander4;
            
            // Compute cubic intersection and sign changes between values
            cell.intersected = sign_change(poly.values) || is_cubic_solvable(coeffs, poly.points.xw, poly.values.xw);
        }
        else 
        {
            // Compute quintic intersection with sign changes
            cell.intersected = poly_sign_change(poly.coeffs);
        }

    #endif

#else

    // Compute berstein coefficients matrix
    mat4x3 bcoeffs_mat = matrixCompMult(poly.bernstein3 * values_mat * poly.bernstein4, poly.bernstein34);

    // Compute berstein coefficients
    sum_anti_diags(bcoeffs_mat, poly.bcoeffs);

    // Compute sign change in berstein coefficients
    if (sign_change(poly.bcoeffs))
    {
        // Compute quintic coefficient matrix
        mat4x3 coeffs_mat = poly.inv_vander3 * values_mat * poly.inv_vander4;

        // Compute quintic coefficient from the sum of anti diagonals 
        sum_anti_diags(coeffs_mat, poly.coeffs);

        #if APPROXIMATION_ENABLED == 0

            // Compute quintic intersection with sign changes
            cell.intersected = poly_sign_change(poly.coeffs);

        #else
            // Compute quintic to cubic maximum residue
            float max_residue = max(
                abs(poly.coeffs[4] * 0.2), 
                abs(poly.coeffs[4] + poly.coeffs[5])
            );

            // If residue is low we can approximate with cubic
            if (max_residue < TOLERANCE.MILLI)
            {
                // Compute values
                poly.values = vec4(poly.coeffs[0], values_mat[1][0], values_mat[2][1], values_mat[3][2]);

                // Compute cubic coefficients
                vec4 coeffs = poly.values * poly.inv_vander4;
                
                // Compute cubic intersection and sign changes between values
                cell.intersected = sign_change(poly.values) || is_cubic_solvable(coeffs, poly.points.xw, poly.values.xw);
            }
            else 
            {
                // Compute quintic intersection with sign changes
                cell.intersected = poly_sign_change(poly.coeffs);
            }
          

        #endif
    }

#endif


#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif


