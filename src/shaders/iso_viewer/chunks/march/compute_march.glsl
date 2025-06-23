
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

const mat4 quintic_sample_sub_bernstein = mat4(
    -308,   269,  -154,    48,
    -1200,  2950, -2300,   800,
    800, -2300,  2950, -1200,
    48,  -154,   269,  -308
) / 240.0;

const mat4x2 quintic_sample_sub_bernstein_2 = mat4x2(
    240, 290, 185,  60,
    60, 185, 290, 240
) / 48.0;


// #if VARIATION_ENABLED == 0
// #include "./deprecated/march_cubic/compute_march"
// #else
// #include "./deprecated/march_cubic_2/compute_march"
// #endif

// #if VARIATION_ENABLED == 0
// #include "./deprecated/march_quintic/compute_march"
// #else
// #include "./deprecated/march_quintic_2/compute_march"
// #endif

#if SKIPPING_METHOD == 0
#include "./modules/compute_march_no_skipping"
#else
#include "./modules/compute_march_skipping"
#endif