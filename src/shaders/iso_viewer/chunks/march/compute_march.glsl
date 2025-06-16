
// #if SKIPPING_ENABLED == 1
// #include "./march_cubic/compute_march"
// #else
// #include "./march_extended/compute_march"
// #endif

// #if SKIPPING_ENABLED == 1
// #include "./march_extended_quintic/compute_march"
// #else
// #include "./march_quintic/compute_march"
// #endif

// #include "./march_analytic/compute_march"
// #include "./march_skipping/compute_march"
// #include "./march_anisotropic/compute_march"
// #include "./march_extended/compute_march"
// #include "./march_extended_quintic/compute_march"


#if SKIPPING_METHOD == 0
#include "./modules/compute_march_no_skipping"
#else
#include "./modules/compute_march_skipping"
#endif