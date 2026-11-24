#ifndef POSITION_TO_BLOCK_COORDS
#define POSITION_TO_BLOCK_COORDS

#include "./positionToCellCoords"

ivec3 positionToBlockCoords(vec3 position)
{
    return positionToCellCoords(position) / u_volume.block_size;
}

#endif
