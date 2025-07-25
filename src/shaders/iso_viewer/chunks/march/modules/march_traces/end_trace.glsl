
if (trace.intersected) 
{ 
    #include "./intersect_trace" 

    #include "./update_hit" 
}

if (hit.discarded) 
{ 
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}
