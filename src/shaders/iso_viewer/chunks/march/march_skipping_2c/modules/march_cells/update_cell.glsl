
// Compute coordinates
cell.coords = ivec3(cell.exit_position * u_intensity_map.inv_spacing + 0.5);

// compute cell bounding box in model coordinates
cell.min_position = (vec3(cell.coords) - MILLI_TOLERANCE - 0.5) * u_intensity_map.spacing;
cell.max_position = (vec3(cell.coords) + MILLI_TOLERANCE + 0.5) * u_intensity_map.spacing;

// compute cell ray intersection to find entry and exit distances, 
cell.entry_distance = cell.exit_distance;
cell.entry_position = cell.exit_position;

cell.exit_distance = intersect_box_max(cell.min_position, cell.max_position, camera.position, ray.direction);
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

// compute termination condition
cell.terminated = cell.exit_distance > ray.end_distance; 

// compute polynomial interpolation inside cell
#include "./update_poly"
