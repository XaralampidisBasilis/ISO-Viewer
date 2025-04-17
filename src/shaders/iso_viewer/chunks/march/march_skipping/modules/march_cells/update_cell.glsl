
// compute coordinates
cell.coords = ivec3(floor(cell.exit_position + 0.5));

// compute box min/max positions
// avoid boundaries when computing coordinates
cell.min_position = vec3(cell.coords) - 0.5;
cell.max_position = vec3(cell.coords) + 0.5;
cell.min_position -= TOLERANCE.CENTI;
cell.max_position += TOLERANCE.CENTI;

// compute entry from previous exit
cell.entry_distance = cell.exit_distance;
cell.entry_position = cell.exit_position;

// compute exit from cell ray intersection 
cell.exit_distance = intersect_box_max(cell.min_position, cell.max_position, camera.position, ray.direction);
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

// compute termination condition
cell.terminated = cell.exit_distance > ray.end_distance; 

// compute polynomial interpolation inside cell
#include "./update_poly"
