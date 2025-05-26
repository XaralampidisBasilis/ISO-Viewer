
// Detect the root intervals based on critical points
bool ra0_r01_r12_r23_r3b[5];
float xa_x0_x1_x2_x3_xb[6], ya_y0_y1_y2_y3_yb[6];
vec2 y0_y5 = vec2(quintic.errors[0], quintic.errors[5]);

is_quintic_solvable(quintic.coefficients, 0.0, quintic.interval, y0_y5,
    xa_x0_x1_x2_x3_xb, ya_y0_y1_y2_y3_yb, ra0_r01_r12_r23_r3b
);

// Detect the first root interval
vec2 xa_xb, ya_yb;
for (int i = 0; i < 5; ++i) {

    if (ra0_r01_r12_r23_r3b[i]) 
    {
        xa_xb = vec2(xa_x0_x1_x2_x3_xb[i], xa_x0_x1_x2_x3_xb[i+1]);
        ya_yb = vec2(ya_y0_y1_y2_y3_yb[i], ya_y0_y1_y2_y3_yb[i+1]);
        break;
    }
}

// Perform Neubauer's method to detect root inside interval
float root = neubauer_root(quintic.coefficients, xa_xb, ya_yb);

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, root);
trace.position = mix(cell.entry_position, cell.exit_position, root); 
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_laplacians_intensity_map(trace.position).a;
trace.error = trace.intensity - u_rendering.intensity;
