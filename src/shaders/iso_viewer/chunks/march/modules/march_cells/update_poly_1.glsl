
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
    // vec4 c = poly.errors * poly.inv_vander4;

    // Combine all the coefficients to reconstruct the quintic
    // Start from the trilinear interpolation coefficients
    sum_anti_diags(C, poly.coeffs);

    // compute sign crossings for quintic intersection
    const int N = 6; 
    cell.intersected = sign_change(poly.errors);

    #pragma unroll
    for (int n = 0; n < N; ++n) 
    {   
        vec4 points = (poly.points + float(n)) / float(N);
        vec4 errors = eval_poly(poly.coeffs, points);
        cell.intersected = cell.intersected || sign_change(errors);
    }

#else

    mat4x3 B = matrixCompMult(poly.bernstein3 * Errors * poly.bernstein4, poly.bernstein34);

    // Combine all the coefficients to reconstruct the quintic
    // Start from the trilinear interpolation coefficients
    sum_anti_diags(B, poly.bcoeffs);

    // If bernstein check allows roots, check analytically
    if (sign_change(poly.bcoeffs))
    {
        mat4x3 C = poly.inv_vander3 * Errors * poly.inv_vander4;
        // vec4 c = poly.errors * poly.inv_vander4;

        // Combine all the coefficients to reconstruct the quintic
        sum_anti_diags(C, poly.coeffs);

        // compute sign crossings for quintic intersection       
        const int N = 6; 
        cell.intersected = sign_change(poly.errors);

        #pragma unroll
        for (int n = 0; n < N; ++n) 
        {   
            vec4 points = (poly.points + float(n)) / float(N);
            vec4 errors = eval_poly(poly.coeffs, points);
            cell.intersected = cell.intersected || sign_change(errors);
        }
    }

#endif

#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif
