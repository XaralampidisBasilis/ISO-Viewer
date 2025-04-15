
// compute cell bounding box in model coordinates
cell.coords = ivec3(cell.exit_position * u_intensity_map.inv_spacing + 0.5);

cell.min_position = (vec3(cell.coords) - 0.5 - MILLI_TOLERANCE) * u_intensity_map.spacing;
cell.max_position = (vec3(cell.coords) + 0.5 + MILLI_TOLERANCE) * u_intensity_map.spacing;

// compute cell ray intersection to find entry and exit distances, 
cell.entry_distance = cell.exit_distance;
cell.exit_distance = intersect_box_max(cell.min_position, cell.max_position, camera.position, ray.direction);

cell.entry_position = cell.exit_position;
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

// given the entry and exit compute the sampling distances inside the cell
poly.distances.x = poly.distances.w;
poly.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, poly.weights.yzw);

// compute the intensity samples inside the cell from the intensity map texture
poly.intensities.x = poly.intensities.w;
poly.intensities.y = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.y).r;
poly.intensities.z = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.z).r;
poly.intensities.w = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.w).r;

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
poly.coefficients = poly.inv_vander * poly.intensities;

// given the polynomial we can compute if we intersect the isosurface inside the cell
cell.intersected = is_cubic_solvable(poly.coefficients, u_rendering.intensity, 0.0, 1.0, poly.intensities.x, poly.intensities.w);
cell.terminated = cell.exit_distance > block.exit_distance; // REALLY IMPORTANT FOR OPTIMIZATION

// Update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
stats.num_steps += 1;
#endif
