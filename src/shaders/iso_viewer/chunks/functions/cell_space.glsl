// Returns the aligned normalized cell coordinates from grid texture coordinates 
#ifndef CELL_SPACE
#define CELL_SPACE

vec3 cell_space(vec3 coords)
{
    return fract(coords - 0.5);
}

#endif