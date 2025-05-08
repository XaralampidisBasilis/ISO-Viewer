// COMPUTE DEBUG 

// intersected
vec4 debug_trace_intersected = to_color(trace.intersected);

// exhausted
vec4 debug_trace_exhausted = to_color(trace.exhausted);

// terminated 
vec4 debug_trace_terminated = to_color(trace.terminated);

// outside
vec4 debug_trace_outside = to_color(!inside_closed_box(0.0, 1.0, map(box.min_position, box.max_position, trace.position)));

// distance
vec4 debug_trace_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, trace.distance));

// position
vec4 debug_trace_position = to_color(map(box.min_position, box.max_position, trace.position));

// intensity 
vec4 debug_trace_intensity = to_color(trace.intensity);

// error
vec4 debug_trace_error = to_color(mmix(COLOR.BLUE, COLOR.BLACK, COLOR.RED, map(-1.0, 1.0, trace.error / MILLI_TOLERANCE)));

// abs error
vec4 debug_trace_abs_error = to_color(mmix(COLOR.BLACK, COLOR.RED, abs(trace.error / MILLI_TOLERANCE)));

// gradient
vec4 debug_trace_gradient = to_color(trace.gradient * 0.5 + 0.5);

// gradient length
vec4 debug_trace_gradient_length = to_color(map(0.0, 1.0, length(trace.gradient)));

// curvature
vec4 debug_trace_curvature = to_color(mmix(COLOR.BLUE, COLOR.BLACK, COLOR.RED, map(-2.0, 2.0, trace.curvature)));

// PRINT DEBUG

switch (u_debugging.option - 200)
{ 
    case  1: fragColor = debug_trace_intersected;     break;
    case  2: fragColor = debug_trace_terminated;      break;
    case  3: fragColor = debug_trace_exhausted;       break;
    case  4: fragColor = debug_trace_outside;         break;
    case  5: fragColor = debug_trace_distance;        break;
    case  6: fragColor = debug_trace_position;        break;
    case  7: fragColor = debug_trace_intensity;       break;
    case  8: fragColor = debug_trace_error;           break;
    case  9: fragColor = debug_trace_abs_error;       break;
    case 10: fragColor = debug_trace_gradient;        break;
    case 11: fragColor = debug_trace_gradient_length; break;
    case 12: fragColor = debug_trace_curvature;       break;
}