
vec3 quadratic_bias(vec3 coords)
{
    vec3 r = cell_space(coords);
    return r * (r - 1.0) * 0.5;
}