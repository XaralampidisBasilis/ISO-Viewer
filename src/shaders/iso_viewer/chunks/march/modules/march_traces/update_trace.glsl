
// Store previous distance
trace.prev_distance = trace.distance;

// Increment distance
trace.distance += trace.spacing;

// Compute position
trace.position = camera.position + ray.direction * trace.distance; 

// Compute termination condition
trace.terminated = trace.distance > ray.end_distance; 

#if RAY_CAPTURE == 1
captureEvent(camera.position + ray.direction * trace.prev_distance, trace.position, trace.prev_distance, trace.distance, 2.0);
#endif

// update stats
#if DEBUG_ENABLED == 1
stats.num_traces += 1;
#endif
