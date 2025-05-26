
#include "./modules/start_cell"

for (int i = 0; i < u_rendering.max_cells; i++) 
{
    #include "./modules/update_cell"

    if (cell.intersected || cell.terminated) 
    {
        break;
    }
}   

#include "./modules/end_march"
