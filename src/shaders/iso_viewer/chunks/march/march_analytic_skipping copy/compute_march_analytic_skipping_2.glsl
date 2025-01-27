
for (int rep = 0; rep < 50; rep++) 
{
    // BLOCK SKIPS

    for (int count = 0; count < MAX_BLOCK_COUNT; count++) 
    {
        #include "./modules/update_block

        if (block.occupied) 
        {
            break;
        }  
        else 
        {
            #include "./modules/skip_block" 

        }
    }
    

    // BLOCK MARCH

    #include "./modules/start_march"

    for (int count = 0; count < MAX_CELL_COUNT; count++, trace.step_count++) 
    {
        #include "./modules/update_cell"

        if (trace.intersected)
        {
            break;
        }

        #include "./modules/update_trace"
        
        if (trace.terminated || trace.exhausted) 
        {
            break;
        }
    }   
}   