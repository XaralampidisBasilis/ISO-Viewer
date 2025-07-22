
// compute box min/max positions in grid space
box.min_position = vec3(0.0);
box.max_position = vec3(u_volume.dimensions);

// deflate box to avoid boundaries
box.min_position += 0.01;
box.max_position -= 0.01; 

// compute rays bound distances with the box
vec2 bounds = box_bounds(box.min_position, box.max_position, camera.position);
box.min_entry_distance = bounds.x;
box.max_exit_distance  = bounds.y;
box.max_span_distance  = bounds.y - bounds.x;
