// compute normalized direction 
ray.direction = normalize(v_ray_direction);
ray.inv_direction = 1.0 / ray.direction;

// compute the octant sign of the direction 
ray.signs = ivec3(ssign(ray.direction));

// compute directional mean cell spacing 
vec3 weights = abs(ray.direction);
ray.spacing = 1.0 / sum(weights);

// compute the 8 groups index
ivec3 bits = ivec3(vec3(ray.signs) * 0.5 + 0.5); 
int octant = (bits.z << 2) | (bits.y << 1) | bits.x;
ray.group8 = octant;          

// compute the 24 groups index
int axis = argmax(abs(ray.direction));
ray.group24 = octant * 3 + axis;
