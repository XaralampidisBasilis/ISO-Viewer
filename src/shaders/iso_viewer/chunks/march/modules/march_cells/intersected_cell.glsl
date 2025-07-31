
#if INTERPOLATION_METHOD == 1

    #if BERNSTEIN_ENABLED == 1

        #include "./intersected_cell/intersected_cell_trilinear_bernstein"

    #else

        #include "./intersected_cell/intersected_cell_trilinear_baseline"

    #endif

#endif
#if INTERPOLATION_METHOD == 2

    #if BERNSTEIN_ENABLED == 1

        #include "./intersected_cell/intersected_cell_tricubic_bernstein"
            
    #else

        #include "./intersected_cell/intersected_cell_tricubic_baseline"

    #endif

#endif




