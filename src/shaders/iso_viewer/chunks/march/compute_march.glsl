
const mat4 cubic_inv_vander = mat4(
    6, -31, 50, -25,
    0, 75, -200, 125,
    0, -50, 175, -125,
    0, 6, -25, 25
) / 6.0;

const mat4 cubic_sample_bernstein = mat4(
    18, -13, 6, 0,
    0, 75, -50, 0,
    0, -50, 75, 0,
    0, 6, -13, 18
) / 18.0;

// #if INTERPOLATION_METHOD == 0
// #include "./deprecated/march_cubic/compute_march"
// #else
// #include "./deprecated/march_cubic_2/compute_march"
// #endif

// #if INTERPOLATION_METHOD == 0
// #include "./deprecated/march_quintic/compute_march"
// #else
// #include "./deprecated/march_quintic_2/compute_march"
// #endif

#if SKIPPING_METHOD == 0
#include "./modules/compute_march_no_skipping"
#else
#include "./modules/compute_march_skipping"
#endif