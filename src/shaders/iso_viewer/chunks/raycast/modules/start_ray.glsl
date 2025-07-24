// compute normalized direction 
ray.direction = normalize(v_ray_direction);
ray.inv_direction = 1.0 / ray.direction;

// compute directional mean cell spacing 
ray.spacing = 1.0 / sum(abs(ray.direction));

// compute the octant sign of the direction 
ray.signs = ivec3(ssign(ray.direction));

// compute 3-bit octant index (0–7) based on sign bits
ivec3 bits = (ray.signs + 1) / 2; 
ray.octant = (bits.z << 2) | (bits.y << 1) | (bits.x << 0);

