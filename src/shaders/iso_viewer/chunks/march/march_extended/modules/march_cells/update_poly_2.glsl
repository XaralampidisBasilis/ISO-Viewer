
// given the start and exit compute the sampling distances inside the cell
poly.distances = mmix(cell.entry_distance, cell.exit_distance, poly.weights);

// compute the intensity samples inside the cell from the intensity map texture
poly.intensities.x = poly.intensities.w;
poly.intensities.y = sample_intensity_map(camera.position + ray.direction * poly.distances.y);
poly.intensities.z = sample_intensity_map(camera.position + ray.direction * poly.distances.z);
poly.intensities.w = sample_intensity_map(camera.position + ray.direction * poly.distances.w);
poly.errors = poly.intensities - u_rendering.intensity;

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
poly.coefficients = poly.inv_vander * poly.intensities;

// check if there are sign crossings between samples
// cell.intersected = any(lessThanEqual(poly.errors.xyz * poly.errors.yzw, vec3(0.0)));
// cell.intersected = any(lessThanEqual(poly.errors.xy * poly.errors.yw, vec2(0.0)));
cell.intersected = any(lessThanEqual(poly.errors.xz * poly.errors.zw, vec2(0.0)));
// cell.intersected = poly.errors.x * poly.errors.w <= 0.0;


