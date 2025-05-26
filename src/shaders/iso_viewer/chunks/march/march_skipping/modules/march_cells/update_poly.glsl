
// given the start and exit compute the sampling distances inside the cell
poly.distances.x = poly.distances.w;
poly.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, poly.weights.yzw);

// compute the intensity samples inside the cell from the intensity map texture
poly.intensities.x = poly.intensities.w;
poly.intensities.y = sample_intensity(camera.position + ray.direction * poly.distances.y);
poly.intensities.z = sample_intensity(camera.position + ray.direction * poly.distances.z);
poly.intensities.w = sample_intensity(camera.position + ray.direction * poly.distances.w);

// compute intensity errors based on iso value
poly.errors.x = poly.errors.w;
poly.errors.yzw = poly.intensities.yzw - u_rendering.intensity;

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
poly.coefficients = poly.inv_vander * poly.errors;

// check if there are sign crossings between samples
// given the polynomial we can compute if we intersect the isosurface inside the cell
cell.intersected = any(lessThanEqual(poly.errors.xyz * poly.errors.yzw, vec3(0.0)));
cell.intersected = cell.intersected || is_cubic_solvable(poly.coefficients, poly.interval, poly.errors.xw);
