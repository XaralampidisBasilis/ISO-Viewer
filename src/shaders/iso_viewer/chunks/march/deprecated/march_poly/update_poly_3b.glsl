
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

#if BERNSTEIN_SKIP_ENABLED == 0

    // Compute quintic coefficient matrix
    mat4x3 C = poly.inv_vander3 * Errors * poly.inv_vander4;
    
    // Compute quintic coefficient from the sum of anti diagonals 
    sum_anti_diags(C, poly.coeffs);

    // Compute quintic to cubic maximum residue
    float t = clamp(-0.8 * poly.coeffs[4] / poly.coeffs[5], 0.0, 1.0);
    float residue = (poly.coeffs[4] + poly.coeffs[5] * t) * t * t * t * t;
    float max_residue = max(abs(poly.coeffs[4] + poly.coeffs[5]), abs(residue));

    debug.variable2 = to_color(max_residue);
    debug.variable3 = to_color(max_residue < u_debugging.variable3);
    debug.variable4.xyz += float(max_residue < u_debugging.variable3) / 100.0;
    
    // If residue is low we can approximate with cubic
    if (max_residue < u_debugging.variable3)
    {   
        // Compute cubic coefficients
        vec4 c = poly.errors * poly.inv_vander4;

        // Compute degenerate quintic coefficients
        poly.coeffs = float[6](c[0], c[1], c[2], c[3], 0.0, 0.0);
        
        // Compute cubic intersection 
        cell.intersected = is_cubic_solvable(c, poly.points.xw, poly.errors.xw);
    }
    else
    {
        // Compute quintic intersection with sign changes
        cell.intersected = poly_sign_change(poly.coeffs);
    }

    // Compute sign changes between samples
    cell.intersected = cell.intersected || sign_change(poly.errors);

#else

    // Compute berstein coefficients matrix
    mat4x3 B = matrixCompMult(poly.bernstein3 * Errors * poly.bernstein4, poly.bernstein34);

    // Compute berstein coefficients
    sum_anti_diags(B, poly.bcoeffs);

    // Compute sign change in berstein coefficients
    if (sign_change(poly.bcoeffs))
    {
        // Compute quintic coefficient matrix
        mat4x3 C = poly.inv_vander3 * Errors * poly.inv_vander4;

        // Compute quintic coefficient from the sum of anti diagonals 
        sum_anti_diags(C, poly.coeffs);

        // Compute quintic to cubic maximum residue
        float t = clamp(-0.8 * poly.coeffs[4] / poly.coeffs[5], 0.0, 1.0);
        float residue = (poly.coeffs[4] + poly.coeffs[5] * t) * t * t * t * t;
        float max_residue = max(abs(poly.coeffs[4] + poly.coeffs[5]), abs(residue));

        debug.variable2 = to_color(max_residue);
        debug.variable3 = to_color(max_residue < u_debugging.variable3);
        debug.variable4.xyz += float(max_residue < u_debugging.variable3) / 10.0;

        // If residue is low we can approximate with cubic
        if (max_residue < u_debugging.variable3)
        {   
            // Compute cubic coefficients
            vec4 c = poly.errors * poly.inv_vander4;

            // Compute degenerate quintic coefficients
            poly.coeffs = float[6](c[0], c[1], c[2], c[3], 0.0, 0.0);
            
            // Compute cubic intersection 
            cell.intersected = is_cubic_solvable(c, poly.points.xw, poly.errors.xw);
        }
        else
        {
            // Compute quintic intersection with sign changes
            cell.intersected = poly_sign_change(poly.coeffs);
        }

        // Compute sign changes between samples
        cell.intersected = cell.intersected || sign_change(poly.errors);
    }

#endif


#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif


