// compute normalized direction 
ray.direction = normalize(v_ray_direction);

// compute the octant sign of the direction 
ray.signs = ivec3(ssign(ray.direction));

// compute directional mean cell spacing 
vec3 weights = abs(ray.direction);
ray.spacing = 1.0 / sum(weights);

// compute the octant and axis indices from direction
ivec3 bits = ivec3(vec3(ray.signs) * -0.5 + 0.5); 
int octant = (bits.z << 2) | (bits.y << 1) | bits.x;
int axis = argmin(abs(ray.direction));
// ray.group = octant;            // for 8 direction groups
ray.group = octant * 3 + axis; // for 24 direction groups
