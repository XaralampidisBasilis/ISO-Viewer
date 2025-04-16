
vec3 weights = abs(ray.direction);
ray.spacing = 1.0 / sum(weights);