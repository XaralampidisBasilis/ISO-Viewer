
#include "./modules/start_march"

for (int batch = 0; batch < MAX_BATCH_COUNT; batch++) 
{
    // Block 

    for (int count = 0; count < MAX_BLOCK_SUB_COUNT; count++) 
    {
        #include "./modules/update_block"

        if (block.occupied) 
        {
            break;
        }  
        
        trace.distance = block.exit_distance;
        trace.position = camera.position + ray.direction * trace.distance; 
    }

    // Cell 

    #include "./modules/start_cell"

    for (int count = 0; count < MAX_CELL_SUB_COUNT; count++) 
    {
        #include "./modules/update_cell"

        if (cell.intersected || cell.terminated) 
        {
            break;
        }
    }   

    // Trace

    #include "./modules/update_trace"

    if (trace.intersected || trace.terminated) 
    {
        break;
    }
}   

#include "./modules/end_march"
