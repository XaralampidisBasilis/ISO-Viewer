
/**
 * Calculates the ray spacing as the mean value of ray depths for all parallel rays 
 * intersecting a voxel's axis-aligned bounding box (aabb).
 */

vec3 weights = abs(ray.direction);
ray.spacing = 1.0 / sum(weights);