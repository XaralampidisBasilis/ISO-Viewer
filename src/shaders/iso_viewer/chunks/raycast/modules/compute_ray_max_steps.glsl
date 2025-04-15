
ivec3 start_coords = ivec3(ray.start_position * u_intensity_map.inv_spacing);
ivec3 end_coords = ivec3(ray.end_position * u_intensity_map.inv_spacing);
ivec3 span_coords = abs(end_coords - start_coords);

ray.max_cells = sum(span_coords) - 2;
ray.max_cells = mmin(ray.max_cells, u_rendering.max_cells, MAX_CELLS);

ray.max_blocks = sum(span_coords / u_distance_map.sub_division) - 2;
ray.max_blocks = mmin(ray.max_blocks, u_rendering.max_blocks, MAX_BLOCKS);
