
#if SKIPPING_ENABLED == 1
#include "./march_extended/compute_march"
#else
#include "./march_extended_quintic/compute_march"
#endif

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
