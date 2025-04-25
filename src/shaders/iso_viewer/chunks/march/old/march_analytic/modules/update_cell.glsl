// Update coords step
cell.coords += cell.coords_step;

// compute cell bounding box in model coordinates
cell.min_position = (vec3(cell.coords) - 0.5) * u_intensity_map.spacing;
cell.max_position = (vec3(cell.coords) + 0.5) * u_intensity_map.spacing;

// Compute entry from previous exit
cell.entry_distance = cell.exit_distance;
cell.entry_position = cell.exit_position;

// compute cell ray intersection to find exit 
cell.exit_distance = intersect_box_max(cell.min_position, cell.max_position, camera.position, ray.direction, cell.axis);
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

// Compute next coords step
cell.coords_step = ivec3(0);
cell.coords_step[cell.axis] = ray.signs[cell.axis];
