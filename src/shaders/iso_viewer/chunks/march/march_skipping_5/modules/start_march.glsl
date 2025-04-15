
// set block
block.exit_distance = ray.start_distance;
block.exit_position = ray.start_position;
block.coords = ivec3((block.exit_position + u_intensity_map.spacing * 0.5) * u_distance_map.inv_spacing);
