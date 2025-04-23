
// compute box min/max positions
cell.min_position = vec3(cell.coords) - 0.5;
cell.max_position = vec3(cell.coords) + 0.5;

// compute entry from previous exit
cell.entry_distance = cell.exit_distance;
cell.entry_position = cell.exit_position;

// compute exit from cell ray intersection 
cell.exit_distance = intersect_box_max(cell.min_position, cell.max_position, camera.position, ray.direction, cell.axis);
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

// compute termination condition
cell.terminated = cell.exit_distance > ray.end_distance; 

// compute next coordinates
cell.coords[cell.axis] += ray.octant[cell.axis];

// compute polynomial interpolation inside cell
#include "./update_poly"
