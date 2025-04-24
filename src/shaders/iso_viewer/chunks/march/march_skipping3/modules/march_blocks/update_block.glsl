
// compute coordinates
block.coords = ivec3(floor(block.exit_position + 0.5)) / u_distance_map.stride;

// compute radius
ivec3 radius = sample_distance3_map(block.coords);
block.occupied = any(equal(radius, ivec3(0)));

// compute box min/max coords
radius = max(radius, 1);
block.min_coords = block.coords - radius + 1;
block.max_coords = block.coords + radius;

// compute box min/max positions
block.min_position = vec3(block.min_coords * u_distance_map.stride) - 0.5;
block.max_position = vec3(block.max_coords * u_distance_map.stride) - 0.5;  

// inflate box to avoid boundaries when computing coordinates
block.min_position -= TOLERANCE.MILLI; 
block.max_position += TOLERANCE.MILLI;

// compute entry from previous exit
block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

// compute exit from cell ray intersection 
block.exit_distance = intersect_box_max(block.min_position, block.max_position, camera.position, ray.direction);
block.exit_position = camera.position + ray.direction * block.exit_distance;

// Compute termination condition
block.terminated = block.exit_distance > ray.end_distance;
