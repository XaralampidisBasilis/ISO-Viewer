

// Returns the aligned normalized cell 
// coordinates from  grid coordinates 
vec3 cell_uvw(vec3 coords)
{
    return fract(coords - 0.5);
}