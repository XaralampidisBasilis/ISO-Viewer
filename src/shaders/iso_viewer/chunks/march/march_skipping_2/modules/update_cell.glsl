
// CURRENT CELL

// Compute sample distances
cell.sample_distances.x = cell.sample_distances.w;
cell.sample_distances.yzw = mmix(cell.entry_distance, cell.exit_distance, weights_vec4.yzw);

// Compute sample intensities
cell.sample_intensities.x = cell.sample_intensities.w;
cell.sample_intensities.y = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * cell.sample_distances.y).r;
cell.sample_intensities.z = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * cell.sample_distances.z).r;
cell.sample_intensities.w = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * cell.sample_distances.w).r;

// Compute the trilinear interpolation cubic polynomial coefficients
cell.intensity_coeffs = inv_vander_mat4 * cell.sample_intensities;

// Compute if there is intersection inside the cell
cell.intersected = is_cubic_solvable(cell.intensity_coeffs, u_rendering.intensity, 0.0, 1.0, cell.sample_intensities.x, cell.sample_intensities.w);


// NEXT CELL

// Compute cell coords from coords step
cell.coords += cell.coords_step;

// Compute cell bounding box
cell.min_position = (vec3(cell.coords) - 0.5) * u_intensity_map.spacing;
cell.max_position = (vec3(cell.coords) + 0.5) * u_intensity_map.spacing;

// Compute ray-cell intersection
cell.entry_distance = cell.exit_distance;
cell.exit_distance = intersect_box_max(cell.min_position, cell.max_position, camera.position, ray.direction, cell.coords_step);

// Compute if this is the terminal cell inside the block
cell.terminated = cell.exit_distance > block.exit_distance;


// Update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
stats.num_steps += 1;
#endif
