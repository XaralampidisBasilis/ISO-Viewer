
// given the entry and exit compute the sampling distances inside the cell
poly.distances.x = poly.distances.w;
poly.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, poly.weights.yzw);

// compute the intensity samples inside the cell from the intensity map texture
poly.intensities.x = poly.intensities.w;
poly.intensities.y = sample_intensity_map(poly.distances.y);
poly.intensities.z = sample_intensity_map(poly.distances.z);
poly.intensities.w = sample_intensity_map(poly.distances.w);

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
poly.coefficients = poly.inv_vander * poly.intensities;

// given the polynomial we can compute if we intersect the isosurface inside the cell
cell.intersected = is_cubic_solvable(poly.coefficients, u_rendering.intensity, 0.0, 1.0, poly.intensities.x, poly.intensities.w);
