
if (cell.intersected) 
{
    #if INTERPOLATION_METHOD == 0
    #include "./march_cells/intersect_cubic"
    #endif

    #if INTERPOLATION_METHOD == 1
    #include "./march_cells/intersect_poly"
    #endif
}

if (!trace.intersected)
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}
