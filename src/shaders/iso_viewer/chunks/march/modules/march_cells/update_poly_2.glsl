
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

    // Combine all the coefficients to reconstruct the quintic
    // Start from the trilinear interpolation coefficients
    poly.coeffs[0] = C[0][0];
    poly.coeffs[1] = C[1][0] + C[0][1];
    poly.coeffs[2] = C[2][0] + C[1][1] + C[0][2];
    poly.coeffs[3] = C[3][0] + C[2][1] + C[1][2];
    poly.coeffs[4] = C[3][1] + C[2][2];
    poly.coeffs[5] = C[3][2];

    // compute quintic intersection
    // compute sign crossings for degenerate cases
    cell.intersected = is_quintic_solvable(poly.coeffs, poly.points.xw, poly.errors.xw)
    || (poly.errors[0] < 0.0) != (poly.errors[1] < 0.0)
    || (poly.errors[1] < 0.0) != (poly.errors[2] < 0.0)
    || (poly.errors[2] < 0.0) != (poly.errors[3] < 0.0);

#else

    mat4x3 B = matrixCompMult(poly.bernstein3 * Errors * poly.bernstein4, poly.bernstein34);

    // Combine all the coefficients to reconstruct the quintic
    // Start from the trilinear interpolation coefficients
    poly.bcoeffs[0] = B[0][0];
    poly.bcoeffs[1] = B[1][0] + B[0][1];
    poly.bcoeffs[2] = B[2][0] + B[1][1] + B[0][2];
    poly.bcoeffs[3] = B[3][0] + B[2][1] + B[1][2];
    poly.bcoeffs[4] = B[3][1] + B[2][2];
    poly.bcoeffs[5] = B[3][2];

    // Compute berstein coefficients signs check to detect no intersection
    cell.intersected = (mmin(poly.bcoeffs) < 0.0) != (mmax(poly.bcoeffs) < 0.0);

    // If bernstein check allows roots, check analytically
    if (cell.intersected)
    {
        mat4x3 C = poly.inv_vander3 * Errors * poly.inv_vander4;

        // Combine all the coefficients to reconstruct the quintic
        poly.coeffs[0] = C[0][0];
        poly.coeffs[1] = C[1][0] + C[0][1];
        poly.coeffs[2] = C[2][0] + C[1][1] + C[0][2];
        poly.coeffs[3] = C[3][0] + C[2][1] + C[1][2];
        poly.coeffs[4] = C[3][1] + C[2][2];
        poly.coeffs[5] = C[3][2];

        // compute quintic intersection
        cell.intersected = is_quintic_solvable(poly.coeffs, poly.points.xw, poly.errors.xw)
        || (poly.errors[0] < 0.0) != (poly.errors[1] < 0.0)
        || (poly.errors[1] < 0.0) != (poly.errors[2] < 0.0)
        || (poly.errors[2] < 0.0) != (poly.errors[3] < 0.0);
    }

#endif

#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif
