
#if INTERPOLATION_METHOD == 1

    #include "./intersect_cell/intersect_cell_trilinear"

#endif
#if INTERPOLATION_METHOD == 2

    #include "./intersect_cell/intersect_cell_tricubic"

#endif

