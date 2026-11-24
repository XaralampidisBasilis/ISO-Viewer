
// start block
block.exit_distance = ray.start_distance;
block.exit_position = camera.position + ray.direction * block.exit_distance; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position; 

block.coords = positionToBlockCoords(block.exit_position);
block.current_coords = block.coords;

#if SKIPPING_METHOD == 0 || MARCHING_METHOD == 0
#if SKIPPING_METHOD == 0
vec3 block_far_distances = blockCoordsToFarDistances(block.coords);
#else
vec3 block_far_distances = distanceBlockCoordsToFarDistances(block.coords);
#endif
vec3 block_step_distances = float(u_volume.block_size) * abs(ray.inv_direction);
#endif
