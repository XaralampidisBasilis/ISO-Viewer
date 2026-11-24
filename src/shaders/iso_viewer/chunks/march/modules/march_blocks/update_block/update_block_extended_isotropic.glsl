

// compute skip distances
ivec3 min_coords, max_coords;
sample_distance_extended_isotropic(block.coords, block.occupied, min_coords, max_coords);
min_coords = max(min_coords, 1);
max_coords = max(max_coords, 1);

// compute skip coords
block.skip_coords = mmix(min_coords, max_coords, max(ray.signs, 0));

// compute min/max coords
block.min_coords = block.coords - (min_coords - 1);
block.max_coords = block.coords + (max_coords - 1);

#include "./update_distance_block"
