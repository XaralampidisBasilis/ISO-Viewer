
if (cell.intersected) 
{ 
    #include "./intersect_cell" 

    if (trace.distance < ray.start_distance || ray.end_distance < trace.distance)
    {
        #if DISCARDING_DISABLED == 0
        discard;  
        #endif
    }
}

