
vec3 quadratic_bias(vec3 coords)
{
    vec3 a = fract(coords - 0.5);
    return a * (a - 1.0) * 0.5;
}