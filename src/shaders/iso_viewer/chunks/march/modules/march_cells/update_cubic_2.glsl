
// given the start and exit compute the sampling distances inside the cell
cubic.distances.x = cubic.distances.w;
cubic.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, cubic.points.yzw);

// compute the intensity samples inside the cell from the intensity map texture
cubic.values[0] = cubic.values[3];
cubic.values[1] = sample_intensity(camera.position + ray.direction * cubic.distances[1]);
cubic.values[3] = sample_intensity(camera.position + ray.direction * cubic.distances[3]);

// compute intensity errors based on iso value
cubic.errors.x = cubic.errors.w;
cubic.errors.yw = cubic.values.yw - u_rendering.intensity;

#if APPROXIMATION_ENABLED == 0

    cubic.values[2] = sample_intensity(camera.position + ray.direction * cubic.distances[2]);
    cubic.errors[2] = cubic.values[2] - u_rendering.intensity;
    cubic.coeffs = cubic.inv_vander * cubic.errors;

    // check cubic intersection and sign crossings for degenerate cases
    cell.intersected = sign_change(cubic.errors) || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.errors.xw);

#else

    vec3 p0 = cell_uvw(camera.position + ray.direction * cubic.distances[0]);
    vec3 p1 = cell_uvw(camera.position + ray.direction * cubic.distances[1]);
    vec3 p3 = cell_uvw(camera.position + ray.direction * cubic.distances[3]);
    vec3 v = abs(p3 - p0);

    float f0 = cubic.values[0]; 
    float f1 = cubic.values[1]; 
    float f3 = cubic.values[3]; 

    p0 = max(p0, 1.0 - p0);
    p1 = max(p1, 1.0 - p1);
    p3 = max(p3, 1.0 - p3);

    f0 = max(f0, 1.0 - f0);
    f1 = max(f1, 1.0 - f1);
    f3 = max(f3, 1.0 - f3);

    float c0 = (f0 + dot(p0 * 2.0 - 1.0, p0.yzx)) / prod(p0); 
    float c1 = (f1 + dot(p1 * 2.0 - 1.0, p1.yzx)) / prod(p1); 
    float c3 = (f3 + dot(p3 * 2.0 - 1.0, p3.yzx)) / prod(p3);

    float max_residue = mmin(c0, c1, c3) * prod(v);

    // If residue is low we can quadratically approximate
    if (max_residue < u_debugging.variable2)
    {
        vec3 coeffs = cubic_inv_vander3 * cubic.errors.xyw;
        cell.intersected = sign_change(cubic.errors.xyw) || is_quadratic_solvable(coeffs, cubic.interval, cubic.errors.xw);
        
        cubic.coeffs[0] = coeffs[0];
        cubic.coeffs[1] = coeffs[1];
        cubic.coeffs[2] = coeffs[2];
        cubic.coeffs[3] = 0.0;
    }
    else
    {  
        cubic.values[2] = sample_intensity(camera.position + ray.direction * cubic.distances[2]);
        cubic.errors[2] = cubic.values[2] - u_rendering.intensity;
        cubic.coeffs = cubic.inv_vander * cubic.errors;
    
        // Compute cubic intersection
        cell.intersected = sign_change(cubic.errors) || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.errors.xw);
    }

#endif

#if STATS_ENABLED == 1
stats.num_checks += 1;
#endif

