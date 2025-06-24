

vec3 p0 = mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[1]);
vec3 p1 = mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[2]);
vec3 p2 = mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[3]);
vec4 g0 = vec4(fract(p0 - 0.5), 2.0);
vec4 g1 = vec4(fract(p1 - 0.5), 2.0);
vec4 g2 = vec4(fract(p2 - 0.5), 2.0);

mat4x3 gx_gy_gz_g = mat4x3(
    g0.x, g1.x, g2.x,
    g0.y, g1.y, g2.y,
    g0.z, g1.z, g2.z,
    g0.w, g1.w, g2.w
);

gx_gy_gz_g = matrixCompMult(gx_gy_gz_g, gx_gy_gz_g - 1.0) * 0.5;

poly.fxx_fyy_fzz_f[0] = poly.fxx_fyy_fzz_f[3];
poly.fxx_fyy_fzz_f[1] = texture(u_textures.trilaplacian_intensity_map, p0 * u_intensity_map.inv_dimensions);
poly.fxx_fyy_fzz_f[2] = texture(u_textures.trilaplacian_intensity_map, p1 * u_intensity_map.inv_dimensions);
poly.fxx_fyy_fzz_f[3] = texture(u_textures.trilaplacian_intensity_map, p2 * u_intensity_map.inv_dimensions);

poly.fxx_fyy_fzz_f[1][3] -= u_rendering.intensity;
poly.fxx_fyy_fzz_f[2][3] -= u_rendering.intensity;
poly.fxx_fyy_fzz_f[3][3] -= u_rendering.intensity;

// Construct the trilinear cubic coefficients
// and the quadratic correction coefficients
mat4x3 F = gx_gy_gz_g * poly.fxx_fyy_fzz_f;

// update samples
poly.f0_f1_f2_f3[0] = poly.f0_f1_f2_f3[3];
poly.f0_f1_f2_f3[1] = F[1][0];
poly.f0_f1_f2_f3[2] = F[2][1];
poly.f0_f1_f2_f3[3] = F[3][2];


#if BERNSTEIN_SKIP_ENABLED == 0

    mat4x3 C = poly.inv_vander3 * F * poly.inv_vander4;

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
    cell.intersected = is_quintic_solvable(poly.coeffs, vec2(0, 1))
    || (poly.f0_f1_f2_f3[0] < 0.0) != (poly.f0_f1_f2_f3[1] < 0.0)
    || (poly.f0_f1_f2_f3[1] < 0.0) != (poly.f0_f1_f2_f3[2] < 0.0)
    || (poly.f0_f1_f2_f3[2] < 0.0) != (poly.f0_f1_f2_f3[3] < 0.0);

#else

    mat4x3 B = matrixCompMult(poly.bernstein3 * F * poly.bernstein4, poly.bernstein34);

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
        mat4x3 C = poly.inv_vander3 * F * poly.inv_vander4;

        // Combine all the coefficients to reconstruct the quintic
        poly.coeffs[0] = C[0][0];
        poly.coeffs[1] = C[1][0] + C[0][1];
        poly.coeffs[2] = C[2][0] + C[1][1] + C[0][2];
        poly.coeffs[3] = C[3][0] + C[2][1] + C[1][2];
        poly.coeffs[4] = C[3][1] + C[2][2];
        poly.coeffs[5] = C[3][2];

        // compute quintic intersection
        cell.intersected = is_quintic_solvable(poly.coeffs, vec2(0, 1))
        || (poly.f0_f1_f2_f3[0] < 0.0) != (poly.f0_f1_f2_f3[1] < 0.0)
        || (poly.f0_f1_f2_f3[1] < 0.0) != (poly.f0_f1_f2_f3[2] < 0.0)
        || (poly.f0_f1_f2_f3[2] < 0.0) != (poly.f0_f1_f2_f3[3] < 0.0);
    }

#endif