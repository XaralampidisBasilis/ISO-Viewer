    
trace.distance = cell.entry_distance;
trace.position = camera.position + ray.direction * trace.distance; 
trace.terminated = trace.distance > ray.end_distance;
