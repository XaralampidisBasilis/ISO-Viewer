

#if INTERPOLATION_METHOD == 1

    #include "./intersect_cell/update_hit_trilinear"

#endif

#if INTERPOLATION_METHOD == 2

    #include "./intersect_cell/update_hit_tricubic"

#endif

