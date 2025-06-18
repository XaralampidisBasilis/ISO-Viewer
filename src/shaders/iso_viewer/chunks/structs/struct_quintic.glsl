#ifndef STRUCT_QUINTIC
#define STRUCT_QUINTIC

struct Quintic 
{
    vec2 interval;
    float intensities[6];    
    float errors[6];
    float distances[6];
    float coeffs[6];  
    float bcoeffs[6];  
    float roots[6];  
    float nroots;
    float weights[6];
    mat3 inv_vander[4]; 
    mat3 bernstein[3]; 
};

Quintic quintic; // Global mutable struct

void set_quintic()
{
    quintic.nroots = 0.0;
    quintic.interval = vec2(0.0, 1.0);
    quintic.distances = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.intensities = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.errors = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.coeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.bcoeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.roots = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.weights = float[6](
        0.0 / 5.0, 
        1.0 / 5.0, 
        2.0 / 5.0, 
        3.0 / 5.0, 
        4.0 / 5.0, 
        5.0 / 5.0
    );
    quintic.inv_vander = mat3[4]
    (
        // inv vander 00
        mat3(
            24, -274,  1125,
            0,  600, -3850,
            0, -600,  5350
        ) / 24.0,

        // inv vander 01
        mat3(
            -2125,  1875,  -625,
            8875, -8750,  3125,
            -14750, 16250, -6250
        ) / 24.0,

        // inv vander 10
        mat3(
            0,  400, -3900,
            0, -150,  1525,
            0,   24,  -250
        ) / 24.0,

        // inv vander 11
        mat3(
            12250, -15000,  6250,
            -5125,   6875, -3125,
            875,  -1250,   625
        ) / 24.0
    );
    quintic.bernstein = mat3[3]
    (
        // bernstein 00
        mat3(
            1, 0, 0,
            -5, 5, 0,
            10, -20, 10
        ),

        // bernstein 10
        mat3(
            -10, 30, -30,
            5, -20, 30,
            -1, 5, -10
        ),

        // bernstein 11
        mat3(
            10, 0, 0,
            -20, 5, 0,
            10, -5, 1
        )
    );
}
#endif 
