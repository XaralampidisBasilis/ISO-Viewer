// copy previous
poly.distances.x = poly.distances.w;
poly.intensities.x = poly.intensities.w;
poly.errors.x = poly.errors.w;

// given the start and exit compute the sampling distances inside the cell
poly.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, poly.weights.yzw);

// compute the intensity samples inside the cell from the intensity map texture
poly.intensities.y = sample_intensity_map(camera.position + ray.direction * poly.distances.y);
poly.intensities.z = sample_intensity_map(camera.position + ray.direction * poly.distances.z);
poly.intensities.w = sample_intensity_map(camera.position + ray.direction * poly.distances.w);

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
poly.errors.yzw = poly.intensities.yzw - u_rendering.intensity;
poly.coefficients = poly.inv_vander * poly.errors;

// check if there are sign crossings between samples
cell.intersected = any(lessThanEqual(poly.errors.xyz * poly.errors.yzw, vec3(0.0)));

// given the polynomial we can compute if we intersect the isosurface inside the cell
cell.intersected = cell.intersected || is_cubic_solvable(poly.coefficients, 0.0, poly.interval, poly.errors.xw);
