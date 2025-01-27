
// Intersect ray with block to find start distance and position
ray.start_distance = intersect_box_max(block.min_position, block.max_position, camera.position, ray.step_direction, block.coords_step);

// Update ray start position
ray.start_position = camera.position + ray.step_direction * ray.start_distance; 

// Compute block coords step
ivec3 coords_step = ivec3((ray.start_position + u_volume.spacing * 0.5) * u_distmap.inv_spacing) - block.coords;
block.coords_step = block.value * block.coords_step + (1 - abs(block.coords_step)) * coords_step;
