
#include "./update_cubic"

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
cubic.coeffs = cubic.residuals * cubic_inv_vander;

// check cubic intersection and sign crossings for degenerate cases
cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, sampling_points.xw, cubic.residuals.xw);

// update stats
#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
stats.num_intersection_tests += 1;
#endif
