
if (trace.intersected) 
{ 
    #include "./compute_hit" 
}

if (hit.discarded) 
{ 
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}
