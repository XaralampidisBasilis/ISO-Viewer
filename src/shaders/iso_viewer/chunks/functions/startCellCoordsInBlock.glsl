#ifndef START_CELL_COORDS_IN_BLOCK
#define START_CELL_COORDS_IN_BLOCK

#include "./positionToCellCoords"

ivec3 startCellCoordsInBlock(ivec3 blockCoords, vec3 entryPosition)
{
    ivec3 minCoords = blockCoords * u_volume.block_size;
    ivec3 maxCoords = minCoords + u_volume.block_size - 1;
    // ISO advances block.coords before starting cells. Use the saved current
    // block and select its interior cell at either entry face.
    return clamp(positionToCellCoords(entryPosition), minCoords, maxCoords);
}

#endif
