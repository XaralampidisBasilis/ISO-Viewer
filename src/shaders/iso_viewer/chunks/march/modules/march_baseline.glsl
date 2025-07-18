
#include "./march_cells/start_cell"

for (int i = 0; i < MAX_CELLS; i++) 
{
    #include "./march_cells/update_cell"

    #include "./march_cells/intersected_cell"

    if (cell.intersected || cell.terminated) 
    {
        break;
    }
}

#include "./march_cells/end_cell"
