

// Define brackets
vec2 distances = vec2(trace.prev_distance, trace.distance);
vec2 residues = vec2(trace.prev_residue, trace.residue);

// Neubauer start
hit.distance = distances.x - (residues.x * diff(distances)) / diff(residues);
hit.position = camera.position + ray.direction * hit.distance; 

#pragma unroll
for (int i = 0; i < 10; ++i)
{
    // evaluate polynomial
    hit.residue = sample_value_tricubic(hit.position) - u_rendering.isovalue;
    
    // determine bracket based on sign
    if (sign_change(residues.x, hit.residue))
    {
        distances.y = hit.distance;
        residues.y = hit.residue;
    }
    else
    {
        distances.x = hit.distance;
        residues.x = hit.residue;
    }

    // Neubauer update
    hit.distance = distances.x - (residues.x * diff(distances)) / diff(residues);
    hit.position = camera.position + ray.direction * hit.distance; 
}

// Compute value
hit.value = hit.residue + u_rendering.isovalue;

// Compute orientation
hit.orientation = ssign(trace.prev_residue - trace.residue);

// Compute gradients and hessian
hit.gradient = compute_gradient(hit.position, hit.hessian);

// Align gradient and hessian to view direction
hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

// Compute normal
hit.normal = normalize(hit.gradient);

// Compute principal curvatures
hit.curvatures = principal_curvatures(hit.gradient, hit.hessian);

// Compute termination condition
hit.discarded = (hit.distance < ray.start_distance || ray.end_distance < hit.distance);

