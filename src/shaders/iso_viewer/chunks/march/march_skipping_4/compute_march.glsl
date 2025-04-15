
#include "./modules/start_march"

for (int count = 0; count < MAX_CELL_COUNT; count++) 
{
    #include "./modules/update_cell"

    if (cell.intersected || cell.terminated) 
    {
        break;
    }
}   

#include "./modules/end_march"