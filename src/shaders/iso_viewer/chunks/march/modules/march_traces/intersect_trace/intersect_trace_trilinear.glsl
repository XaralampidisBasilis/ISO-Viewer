

// Compute start
vec2 distances = vec2(trace.distance); 
vec2 residues = vec2(trace.residue);

// Compute start
distances[0] = trace.distance - ray.spacing;
residues[0] = sample_volume_trilinear(camera.position + ray.direction * distances[0]);

// Bisection start
trace.distance = mean(distances);
trace.position = camera.position + ray.direction * trace.distance; 

#pragma unroll
for (int i = 0; i < 20; ++i)
{
    // evaluate polynomial
    trace.residue = sample_volume_trilinear(trace.position);

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

    // Bisection update
    trace.distance = mean(distances);
    trace.position = camera.position + ray.direction * trace.distance; 
}


