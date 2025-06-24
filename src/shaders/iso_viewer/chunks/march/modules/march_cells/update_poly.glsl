

vec3 p0 = mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[1]);
vec3 p1 = mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[2]);
vec3 p2 = mix(cell.entry_position, cell.exit_position, poly.t0_t1_t2_t3[3]);
vec3 g0 = fract(p0 - 0.5);
vec3 g1 = fract(p1 - 0.5);
vec3 g2 = fract(p2 - 0.5);

mat3 g0_g1_g2 = mat3(
    g0.x, g1.x, g2.x,
    g0.y, g1.y, g2.y,
    g0.z, g1.z, g2.z
);
g0_g1_g2 = matrixCompMult(g0_g1_g2, g0_g1_g2 - 1.0) / 2.0;

poly.fxx_fyy_fzz_f[0] = poly.fxx_fyy_fzz_f[3];
poly.fxx_fyy_fzz_f[1] = texture(u_textures.trilaplacian_intensity_map, p0 * u_intensity_map.inv_dimensions);
poly.fxx_fyy_fzz_f[2] = texture(u_textures.trilaplacian_intensity_map, p1 * u_intensity_map.inv_dimensions);
poly.fxx_fyy_fzz_f[3] = texture(u_textures.trilaplacian_intensity_map, p2 * u_intensity_map.inv_dimensions);

// Construct the trilinear cubic coefficients
// and the quadratic correction coefficients
mat4 A = poly.fxx_fyy_fzz_f * poly.inv_vander4;
mat3 B = poly.transp_inv_vander3 * g0_g1_g2;
mat4x3 BA = B * mat4x3(A);

// Combine all the coefficients to reconstruct the quintic
// Start from the trilinear interpolation coefficients
poly.coeffs[0] = BA[0][0] + A[0][3];
poly.coeffs[1] = BA[1][0] + BA[0][1] + A[1][3];
poly.coeffs[2] = BA[2][0] + BA[1][1] + BA[0][2] + A[2][3];
poly.coeffs[3] = BA[3][0] + BA[2][1] + BA[1][2] + A[3][3];
poly.coeffs[4] = BA[3][1] + BA[2][2];
poly.coeffs[5] = BA[3][2];

// compute quintic intersection
// compute sign crossings for degenerate cases
poly.coeffs[0] -= u_rendering.intensity;
cell.intersected = is_quintic_solvable(poly.coeffs, vec2(0.0, 1.0));




