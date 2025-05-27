
// given the start and exit compute the sampling distances inside the cell
cubic.distances.x = cubic.distances.w;
cubic.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, cubic.weights.yzw);

// compute the intensity samples inside the cell from the intensity map texture
cubic.intensities.x = cubic.intensities.w;
cubic.intensities.y = sample_intensity(camera.position + ray.direction * cubic.distances.y);
cubic.intensities.z = sample_intensity(camera.position + ray.direction * cubic.distances.z);
cubic.intensities.w = sample_intensity(camera.position + ray.direction * cubic.distances.w);

// compute intensity errors based on iso value
cubic.errors.x = cubic.errors.w;
cubic.errors.yzw = cubic.intensities.yzw - u_rendering.intensity;

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
cubic.coefficients = cubic.inv_vander * cubic.errors;

// check if there are sign crossings between samples
// given the polynomial we can compute if we intersect the isosurface inside the cell
cell.intersected = any(lessThanEqual(cubic.errors.xyz * cubic.errors.yzw, vec3(0.0)));
cell.intersected = cell.intersected || is_cubic_solvable(cubic.coefficients, cubic.interval, cubic.errors.xw);
