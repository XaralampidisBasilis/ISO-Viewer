
#include "./modules/start_march"

for (int n = 0; n < MAX_BLOCKS; n++) 
{
    #include "./modules/update_block"

    if (block.occupied)
    {
        #include "./modules/start_cell"

        for (int i = 0; i < MAX_CELLS_PER_BLOCK; i++) 
        {
            #include "./modules/update_cell"

            if (cell.intersected || cell.terminated) 
            {
                break;
            }
        }
    }

    cell.terminated = cell.exit_distance > ray.end_distance;

    if (cell.intersected || cell.terminated || block.terminated) 
    {
        break;
    }
}   

#include "./modules/end_march"