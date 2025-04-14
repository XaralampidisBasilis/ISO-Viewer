
// given the entry and exit compute the sampling distances inside the cell
poly.distances.x   = poly.distances.w;
poly.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, poly.weights.yzw);

// compute the intensity samples inside the cell from the intensity map texture
poly.intensities.x = poly.intensities.w;
poly.intensities.y = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.y).r;
poly.intensities.z = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.z).r;
poly.intensities.w = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.w).r;

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
poly.coefficients = poly.inv_vander * poly.intensities;

// given the polynomial we can compute if we intersect the isosurface inside the cell
trace.intersected = is_cubic_solvable
(
    poly.coefficients, 
    u_rendering.intensity, 
    0.0, 
    1.0, 
    poly.intensities.x, 
    poly.intensities.w
);
