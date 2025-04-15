
// compute coordinates
block.coords = ivec3(block.exit_position + 0.5) / u_distance_map.stride;

// compute radius
block.radius = sample_distance_map(block.coords);
block.occupied = block.radius == 0;
block.radius = max(block.radius - 1, 0);

// compute box min/max coords
block.min_coords = block.coords - block.radius;
block.max_coords = block.coords + block.radius;

// compute box min/max positions
block.min_position = vec3((block.min_coords + 0) * u_distance_map.stride) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_distance_map.stride) - 0.5;  

// to avoid boundaries when computing coordinates
block.min_position -= CENTI_TOLERANCE;
block.max_position += CENTI_TOLERANCE;

// compute entry from previous exit
block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

// compute exit from cell ray intersection 
block.exit_distance = intersect_box_max(block.min_position, block.max_position, ray.start_position, ray.direction);
block.exit_position = ray.start_position + ray.direction * block.exit_distance;

// Compute termination condition
block.terminated = block.exit_distance > ray.span_distance;
