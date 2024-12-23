#include "./modules/start_march"

for (int count = 0; count < u_rendering.max_step_count; count++, trace.step_count++) 
{
    #include "./modules/update_block
    #include "./modules/skip_block" 

    // if (block.occupied) 
    // {
    //     #include "./modules/update_cell"
    //     #include "./modules/update_march"
    // }  
    // else
    // {
    //     #include "./modules/skip_block" 
    // }

    // if (voxel.saturated || trace.exhausted || trace.terminated) 
    // {
    //     break;
    // }
}   

#include "./modules/end_march"
