
if (cell.intersected) 
{
   #if INTERPOLATION_METHOD == 0
    #include "./march_cells/intersect_cubic"
    #else
    #include "./march_cells/intersect_quintic"
    #endif
}

if (!trace.intersected)
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}
