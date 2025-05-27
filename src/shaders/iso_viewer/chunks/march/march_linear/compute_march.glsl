
#include "./modules/start_cell"

for (int i = 0; i < MAX_CELLS; i++) 
{
    #include "./modules/update_cell"

    if (cell.intersected || cell.terminated) 
    {
        break;
    }
}   

#include "./modules/end_march"
