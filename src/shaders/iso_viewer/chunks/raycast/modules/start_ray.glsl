// compute normalized direction 
ray.direction = normalize(v_ray_direction);

// compute the octant sign of the direction 
ray.signs = ivec3(ssign(ray.direction));

// compute the octant index from direction sign
ivec3 bits = ivec3(vec3(ray.signs) * -0.5 + 0.5); 
ray.octant = (bits.z << 2) | (bits.y << 1) | bits.x;

// compute directional mean cell spacing 
vec3 weights = abs(ray.direction);
ray.spacing = 1.0 / sum(weights);