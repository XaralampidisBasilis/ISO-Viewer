
// Compute points
vec3 p0 = mix(cell.entry_position, cell.exit_position, poly.points[1]);
vec3 p1 = mix(cell.entry_position, cell.exit_position, poly.points[2]);
vec3 p2 = mix(cell.entry_position, cell.exit_position, poly.points[3]);

// Compute errors
poly.errors[0] = poly.errors[3];
poly.errors[1] = sample_trilaplacian_intensity(p0) - u_rendering.intensity;
poly.errors[2] = sample_trilaplacian_intensity(p1) - u_rendering.intensity;
poly.errors[3] = sample_trilaplacian_intensity(p2) - u_rendering.intensity;

#if BERNSTEIN_SKIP_ENABLED == 0

    // Compute berstein coefficients
    cubic.coeffs = poly.errors * poly.inv_vander4;

    // Compute cubic intersection and sign changes
    cell.intersected = is_cubic_solvable(cubic.coeffs, poly.points.xw, poly.errors.xw) || sign_change(poly.errors);

#else

    // Compute berstein coefficients
    vec4 b = poly.errors * poly.bernstein4;

    // Compute berstein coefficients sign change
    if (sign_change(b)) 
    {
        // Compute cubic coefficients
        cubic.coeffs = poly.errors * poly.inv_vander4;

        // Compute cubic intersection and sign changes
        cell.intersected = is_cubic_solvable(cubic.coeffs, poly.points.xw, poly.errors.xw) || sign_change(poly.errors);
    }

#endif

if (cell.intersected)
{
    poly.coeffs[0] = cubic.coeffs[0];
    poly.coeffs[1] = cubic.coeffs[1];
    poly.coeffs[2] = cubic.coeffs[2];
    poly.coeffs[3] = cubic.coeffs[3];
    poly.coeffs[4] = 0.0;
    poly.coeffs[5] = 0.0;
}
 