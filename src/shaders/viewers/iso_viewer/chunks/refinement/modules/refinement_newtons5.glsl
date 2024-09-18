/**
 * Refines the hit point by performing additional sampling steps.
 *
 * @param u_raycast: struct containing raycast-related uniforms.
 * @param u_gradient: struct containing gradient-related uniforms.
 * @param u_sampler: struct containing volume-related uniforms.
 * @param ray_step: step vector for raycasting increments.
 * @param hit_position: inout vec3 where the refined position of the intersection will be stored.
 * @param hit_sample: output float where the refined value at the intersection will be stored.
 * @param hit_normal: output vec3 where the refined normal at the intersection will be stored.
 */
 
// save not refined solution
parameters_trace temp_trace;
copy_trace(temp_trace, trace);

// begin at initial guess and iterate from there
vec2 distances = vec2(prev_trace.distance, trace.distance);
distances = clamp(distances, ray.min_distance, ray.max_distance);

float s_linear = map(prev_trace.value, trace.value, u_raycast.threshold);
trace.distance = mix(distances.x, distances.y, s_linear);

vec4 volume_data;

#pragma unroll_loop_start
for (int i = 0; i < 5; i++, trace.steps++) 
{
    // sample intensity at new position
    trace.position = ray.origin + ray.direction * trace.distance;
    trace.texel = trace.position * u_volume.inv_size;

    // Extract intensity value from volume data
    volume_data = texture(u_sampler.volume, trace.texel);
    trace.value = volume_data.r;
    trace.error = trace.value - u_raycast.threshold;

    // Extract gradient from volume data
    trace.gradient = (2.0 * volume_data.gba - 1.0) * u_gradient.max_norm;
    trace.gradient_norm = length(trace.gradient);
    trace.normal = - normalize(trace.gradient);
    trace.derivative = dot(trace.gradient, ray.direction);

    // newton–raphson method to approximate next distance
    trace.distance -= trace.error / stabilize(trace.derivative);
    trace.distance = clamp(trace.distance, distances.x, distances.y);
}
#pragma unroll_loop_end

trace.coords = floor(trace.position * u_volume.inv_spacing);
trace.depth = trace.distance - ray.min_distance;

// if we do not have any improvement with refinement go to previous solution
if (abs(trace.error) > abs(temp_trace.error)) {
    copy_trace(trace, temp_trace);
}

