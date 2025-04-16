// Compute block that current cell is inside
#include "./compute_block"

// Compute cell bounding box in model coordinates
cell.min_position = (vec3(cell.coords) - 0.5 - MILLI_TOLERANCE) * u_intensity_map.spacing;
cell.max_position = (vec3(cell.coords) + 0.5 + MILLI_TOLERANCE) * u_intensity_map.spacing;

// Compute cell as block if chebyshev distance is zero
cell.min_position = (block.occupied) ? cell.min_position : block.min_position;
cell.max_position = (block.occupied) ? cell.max_position : block.max_position;

// Compute entry from previous exit
cell.entry_distance = cell.exit_distance;
cell.entry_position = cell.exit_position;

// Compute cell ray intersection to find exit 
cell.exit_distance = intersect_box_max(cell.min_position, cell.max_position, camera.position, ray.direction, cell.axis);
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

// Compute termination condition
cell.terminated = cell.exit_distance > ray.end_distance;

// Compute next coordinates 
cell.coords = ivec3(cell.exit_position * u_intensity_map.inv_spacing + 0.5);

// int stride = max(block.radius * u_distance_map.stride, 1);
// int coordinate = cell.coords[cell.axis];
// coordinate += ray.octant[cell.axis] * stride;

// cell.coords = ivec3(cell.exit_position * u_intensity_map.inv_spacing + 0.5);
// cell.coords[cell.axis] = coordinate;


// Compute interpolation inside the cell
if (block.occupied)
{
    #include "./compute_interpolation"
}
