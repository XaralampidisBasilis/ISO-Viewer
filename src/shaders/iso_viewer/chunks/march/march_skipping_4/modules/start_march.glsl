// start cell 
cell.coords = ivec3(ray.start_position * u_intensity_map.inv_spacing + 0.5);
cell.coords = clamp(cell.coords, ivec3(0), u_intensity_map.dimensions);
cell.exit_distance = ray.start_distance;
