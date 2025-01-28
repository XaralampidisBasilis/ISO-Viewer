    
trace.distance = cell.exit_distance;
trace.position = camera.position + ray.step_direction * trace.distance; 

trace.intersected = cell.intersected;
trace.terminated = trace.distance > ray.end_distance;
trace.exhausted = trace.terminated ? false : trace.step_count >= MAX_CELL_COUNT;