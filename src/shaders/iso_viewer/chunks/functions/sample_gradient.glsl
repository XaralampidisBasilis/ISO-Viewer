#if GRADIENTS_METHOD == 1

    #if INTERPOLATION_METHOD == 1

        #include "./sample_gradient/sample_gradient_trilinear_analytic"

    #endif
    #if INTERPOLATION_METHOD == 2

        #include "./sample_gradient/sample_gradient_tricubic_analytic"

    #endif

#endif
#if GRADIENTS_METHOD == 2

    #include "./sample_gradient/sample_gradient_trilinear_sobel"

#endif
#if GRADIENTS_METHOD == 3

    #include "./sample_gradient/sample_gradient_triquadratic_bspline"

#endif
#if GRADIENTS_METHOD == 4

    #include "./sample_gradient/sample_gradient_tricubic_bspline"

#endif

