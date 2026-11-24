#if MARCHING_METHOD == 0

bool single_block_step = all(equal(block.skip_coords, ivec3(1)));
vec3 block_far_planes = blockBoundsToFarPlanes(block.min_position, block.max_position);

// A larger distance-map step changes the box and invalidates cached face distances.
if (!single_block_step)
    block_far_distances = blockPlanesToFarDistances(block_far_planes);

block.exit_distance = intersectBlockFarDistances(block_far_planes, block_far_distances, block.exit_normal);

ivec3 adjacent_block_coords = block.coords + block.exit_normal * ray.signs;

#else

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);

#endif
