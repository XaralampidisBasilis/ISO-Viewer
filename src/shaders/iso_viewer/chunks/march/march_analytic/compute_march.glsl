
#include "./modules/start_march"

for (int n = 0; n < MAX_CELLS; n++) 
{
    #include "./modules/update_cell"

    if (cell.intersected || cell.terminated) 
    {
        break;
    }
}   

#include "./modules/end_march"
