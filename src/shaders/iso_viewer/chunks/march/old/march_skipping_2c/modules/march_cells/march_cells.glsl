
// March analytically the volume cells inside an occupied block
#include "./start_cell"

for (int i = 0; i < MAX_CELLS_PER_BLOCK; i++) 
{
    #include "./update_cell"

    if (cell.intersected || cell.terminated || cell.exit_distance > block.exit_distance) 
    {
        break;
    }
}   