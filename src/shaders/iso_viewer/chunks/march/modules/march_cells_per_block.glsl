
#include "./march_cells/start_cell"

for (int i = 0; i < MAX_CELLS_PER_BLOCK; i++) 
{
    #include "./march_cells/update_cell"
    
    #include "./march_cells/intersected_cell"

    if (cell.intersected || cell.terminated || cell.exit_distance > block.exit_distance) 
    {
        break;
    }
}   
