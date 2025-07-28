

// Define brackets
vec2 distances = vec2(trace.prev_distance, trace.distance);
vec2 residues = vec2(trace.prev_residue, trace.residue);

// Neubauer start
float span_distance = distances.y - distances.x;
float span_residue = residues.y - residues.x;

hit.distance = distances.x - (residues.x * span_distance) / span_residue;
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
    span_distance = distances.y - distances.x;
    span_residue = residues.y - residues.x;

    hit.distance = distances.x - (residues.x * span_distance) / span_residue;
    hit.position = camera.position + ray.direction * hit.distance; 
}

// Compute value
hit.value = hit.residue + u_rendering.isovalue;

// Compute facing direction
hit.facing = ssign(trace.prev_residue - trace.residue);

// Compute gradients and hessian
hit.gradient = compute_gradient(hit.position, hit.hessian);

// Align gradient and hessian to view direction
hit.gradient *= hit.facing; 
hit.hessian *= hit.facing;

// Compute normal
hit.normal = normalize(hit.gradient);

// Compute principal curvatures
hit.curvatures = principal_curvatures(hit.gradient, hit.hessian);

// Compute termination condition
hit.discarded = (hit.distance < ray.start_distance || ray.end_distance < hit.distance);

