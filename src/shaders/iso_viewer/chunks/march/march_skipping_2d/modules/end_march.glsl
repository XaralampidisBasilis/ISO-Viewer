

if (cell.intersected) 
{
    #include "./compute_intersection"
}

if (!cell.intersected || trace.distance > ray.span_distance)
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}

trace.exhausted = !(cell.intersected || cell.terminated);
