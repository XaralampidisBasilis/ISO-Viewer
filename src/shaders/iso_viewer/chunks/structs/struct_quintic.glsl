#ifndef STRUCT_QUINTIC
#define STRUCT_QUINTIC

struct Quintic 
{
    vec2 interval;
    float intensities[6];    
    float errors[6];
    float distances[6];
    float coefficients[6];    
    float weights[6];
    mat3 inv_vander[4]; 
};

Quintic quintic; // Global mutable struct

void set_quintic()
{
    quintic.interval = vec2(0.0, 1.0);
    quintic.distances = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.intensities = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.errors = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.coefficients = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.weights = float[6](
        0.0/5.0, 
        1.0/5.0, 
        2.0/5.0, 
        3.0/5.0, 
        4.0/5.0, 
        5.0/5.0
    );
    quintic.inv_vander = mat3[4]
    (
        // inv vander 00
        mat3(
            24.0, -274.0,  1125.0,
            0.0,  600.0, -3850.0,
            0.0, -600.0,  5350.0
        ) / 24.0,

        // inv vander 01
        mat3(
            -2125.0,  1875.0,  -625.0,
            8875.0, -8750.0,  3125.0,
            -14750.0, 16250.0, -6250.0
        ) / 24.0,

        // inv vander 10
        mat3(
            0.0,  400.0, -3900.0,
            0.0, -150.0,  1525.0,
            0.0,   24.0,  -250.0
        ) / 24.0,

        // inv vander 11
        mat3(
            12250.0, -15000.0,  6250.0,
            -5125.0,   6875.0, -3125.0,
            875.0,  -1250.0,   625.0
        ) / 24.0
    );
}
#endif 
