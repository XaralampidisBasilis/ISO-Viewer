
// compute radius
block.radius = sample_distance_map(block.coords);
block.occupied = block.radius == 0;
block.radius = max(block.radius, 1);

// compute next coordinates
int iterations = block.radius * 3 - 2;
ivec3 start_coords = block.coords;

// perform dda
for (int i = 0; i <= iterations; i++)
{
    // compute min/max coords
    block.min_position = vec3((block.coords + 0) * u_distance_map.stride) - 0.5;
    block.max_position = vec3((block.coords + 1) * u_distance_map.stride) - 0.5;  

    // compute entry from previous exit
    block.entry_distance = block.exit_distance;
    block.entry_position = block.exit_position;

    // compute exit from block ray intersection 
    block.exit_distance = intersect_box_max(block.min_position, block.max_position, camera.position, ray.inv_direction, block.axes);
    block.exit_position = camera.position + ray.direction * block.exit_distance;

    // compute next coordinates
    block.coords += block.axes * ray.signs;

    // compute termination for dda
    bool condition = any(equal(abs(block.coords - start_coords), ivec3(block.radius)));
    if (condition)
    {
        break;
    }
}

// compute termination condition
block.terminated = block.exit_distance > ray.end_distance;

// update stats
#if STATS_ENABLED == 1
stats.num_blocks += 1;
#endif

