

// Define brackets
vec2 distances = vec2(trace.prev_distance, trace.distance);
vec2 residues = vec2(trace.prev_residue, trace.residue);

// Neubauer start
float span_distance = distances.y - distances.x;
float span_residue = residues.y - residues.x;

trace.distance = distances.x - (residues.x * span_distance) / span_residue;
trace.position = camera.position + ray.direction * trace.distance; 

#pragma unroll
for (int i = 0; i < 10; ++i)
{
    // evaluate polynomial
    trace.residue = sample_volume_trilinear(trace.position) - u_rendering.isovalue;

    // determine bracket based on sign
    if (sign_change(trace.residue, residues.y))
    {
        distances.x = trace.distance;
        residues.x = trace.residue;
    }
    else
    {
        distances.y = trace.distance;
        residues.y = trace.residue;
    }

    // Neubauer update
    span_distance = distances.y - distances.x;
    span_residue = residues.y - residues.x;

    trace.distance = distances.x - (residues.x * span_distance) / span_residue;
    trace.position = camera.position + ray.direction * trace.distance; 
}
