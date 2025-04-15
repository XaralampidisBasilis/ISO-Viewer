
#include "./modules/start_march"

for (int count = 0; count < MAX_CELLS; count++) 
{
    #include "./modules/update_cell"
    #include "./modules/update_poly"

    if (trace.intersected)
    {
        break;
    }

    #include "./modules/update_trace"
    
    if (trace.terminated) 
    {
        break;
    }
}   

#include "./modules/end_march"