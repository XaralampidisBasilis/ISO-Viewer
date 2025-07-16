
// given the start and exit compute the sampling distances inside the cell
cubic.distances.x = cubic.distances.w;
cubic.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, cubic.points.yzw);

// compute the intensity samples inside the cell from the intensity map texture
cubic.values[0] = cubic.values[3];
cubic.values[1] = sample_intensity(camera.position + ray.direction * cubic.distances[1]);
cubic.values[2] = sample_intensity(camera.position + ray.direction * cubic.distances[2]);
cubic.values[3] = sample_intensity(camera.position + ray.direction * cubic.distances[3]);

// compute intensity errors based on iso value
cubic.residuals.x = cubic.residuals.w;
cubic.residuals.yzw = cubic.values.yzw - u_rendering.intensity;

#if BERNSTEIN_SKIP_ENABLED == 0

    // from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
    cubic.coeffs = cubic.inv_vander * cubic.residuals;

    #if APPROXIMATION_ENABLED == 0

        // check cubic intersection and sign crossings for degenerate cases
        cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.residuals.xw);

    #else

        // Compute cubic to linear maximum residue
        float max_residue = max(
            abs(cubic.coeffs[2] / 3.0),
            abs(cubic.coeffs[2] / 3.0 + cubic.coeffs[3])
        );

        // Compute sign change
        cell.intersected = sign_change(cubic.residuals);

        // If residue is low we can linearly approximate
        if (max_residue > TOLERANCE.CENTI)
        {
            // Compute cubic intersection
            cell.intersected = cell.intersected || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.residuals.xw);
        }

    #endif

    #if STATS_ENABLED == 1
    stats.num_checks += 1;
    #endif

#else

    // compute berstein coefficients from samples
    cubic.bcoeffs = cubic.sample_bernstein * cubic.residuals;

    // If bernstein check allows roots, check analytically
    if (sign_change(cubic.bcoeffs))
    {
        // from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
        cubic.coeffs = cubic.inv_vander * cubic.residuals;

        #if APPROXIMATION_ENABLED == 0

            // check cubic intersection and sign crossings for degenerate cases
            cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.residuals.xw);

        #else

            // Compute cubic to linear maximum residue
            float max_residue = max(
                abs(cubic.coeffs[2] / 3.0),
                abs(cubic.coeffs[2] / 3.0 + cubic.coeffs[3])
            );

            // Compute sign change
            cell.intersected = sign_change(cubic.residuals);

            // If residue is low we can linearly approximate
            if (max_residue > TOLERANCE.CENTI)
            {
                // Compute cubic intersection
                cell.intersected = cell.intersected || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.residuals.xw);
            }

        #endif
        
        #if STATS_ENABLED == 1
        stats.num_checks += 1;
        #endif
    }

#endif

