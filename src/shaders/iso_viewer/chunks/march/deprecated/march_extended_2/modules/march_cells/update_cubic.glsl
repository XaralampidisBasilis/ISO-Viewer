
// given the start and exit compute the sampling distances inside the cell
cubic.distances.x = cubic.distances.w;
cubic.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, cubic.points.yzw);

// compute the intensity samples inside the cell from the intensity map texture
cubic.values.x = cubic.values.w;
cubic.values.y = sample_intensity(camera.position + ray.direction * cubic.distances.y);
cubic.values.z = sample_intensity(camera.position + ray.direction * cubic.distances.z);
cubic.values.w = sample_intensity(camera.position + ray.direction * cubic.distances.w);

// compute intensity errors based on iso value
cubic.errors.x = cubic.errors.w;
cubic.errors.yzw = cubic.values.yzw - u_rendering.intensity;

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
cubic.coeffs = cubic.inv_vander * cubic.errors;

// check if there are sign crossings between samples for degenerate cases
cell.intersected = any(lessThanEqual(cubic.errors.xyz * cubic.errors.yzw, vec3(0.0)));

// check polynomial intersection
cell.intersected = cell.intersected || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.errors.xw);

// // from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
// cubic.bcoeffs = cubic.A * cubic.errors;

// // If bernstein bounds allow for a root
// if ((mmin(cubic.bcoeffs) < 0.0) != (mmax(cubic.bcoeffs) < 0.0))
// {
//     // check if there are sign crossings between samples for degenerate cases
//     cell.intersected = any(lessThanEqual(cubic.errors.xyz * cubic.errors.yzw, vec3(0.0)));

//     // check polynomial intersection
//     cubic.coeffs = cubic.inv_vander * cubic.errors;
//     cell.intersected = cell.intersected || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.errors.xw);
// }
