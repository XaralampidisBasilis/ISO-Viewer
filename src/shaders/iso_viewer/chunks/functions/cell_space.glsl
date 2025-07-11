

// Returns the aligned normalized cell coordinates from grid texture coordinates 

vec3 cell_space(vec3 coords)
{
    return fract(coords - 0.5);
}