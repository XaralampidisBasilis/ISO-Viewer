
// start block
block.entry_distance = ray.start_distance;
block.entry_position = ray.start_position; 

block.exit_distance = ray.start_distance;
block.exit_position = ray.start_position; 

block.coords = ivec3(round(block.exit_position)) / u_distance_map.stride;