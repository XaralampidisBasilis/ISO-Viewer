
#include "./march_cells/start_cell"

for (int i = 0; i < MAX_CELLS; i++) 
{
    #include "./march_cells/update_cell"

    if (cell.intersected || cell.terminated) 
    {
        break;
    }
}   

#include "./end_march"
