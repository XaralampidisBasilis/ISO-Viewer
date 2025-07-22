
if (cell.intersected) 
{ 
    #include "./intersect_cell" 

    #include "./update_hit" 
}

if (hit.discarded) 
{ 
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}
