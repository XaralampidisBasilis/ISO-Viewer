
if (cell.intersected) 
{ 
    #include "./march_cells/intersect_cell" 
}
if (!trace.intersected)
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}
