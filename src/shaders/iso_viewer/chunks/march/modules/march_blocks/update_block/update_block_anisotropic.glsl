
// compute skip distance
block.skip_coords = sample_distance_anisotropic(block.coords, ray.octant, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

// compute min/max coords
block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

#include "./update_distance_block"
