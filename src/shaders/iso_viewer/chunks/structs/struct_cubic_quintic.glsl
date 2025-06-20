#ifndef STRUCT_CUBIC_QUINTIC
#define STRUCT_CUBIC_QUINTIC

struct CubicQuintic 
{
    vec2 interval;
    float intensities[6];    
    float corrections[6];    
    float errors[6];
    float distances[6];
    float coeffs[6];  
    float bcoeffs[6];  
    float roots[6];  
    float nroots;
    float weights[6];
    mat3 inv_vander[4]; 
    mat3 sample_bernstein[4]; // samples to berstein coefficients
};

CubicQuintic cubic_quintic; // Global mutable struct

void set_cubic_quintic()
{
    cubic_quintic.nroots = 0.0;
    cubic_quintic.interval = vec2(0.0, 1.0);
    cubic_quintic.distances = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    cubic_quintic.intensities = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    cubic_quintic.corrections = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    cubic_quintic.errors = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    cubic_quintic.coeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    cubic_quintic.bcoeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    cubic_quintic.roots = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    cubic_quintic.weights = float[6](
        0.0 / 5.0, 
        1.0 / 5.0, 
        2.0 / 5.0, 
        3.0 / 5.0, 
        4.0 / 5.0, 
        5.0 / 5.0
    );
    cubic_quintic.inv_vander = mat3[4]
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
    cubic_quintic.sample_bernstein = mat3[4]
    (
        // inv vander 00
        mat3(
            240, -308, 269,
            0, 1200, -1450,
            0, -1200, 2950
        ) / 240.0,

        // inv vander 01
        mat3(
            -154, 48, 0,
            925, -300, 0,
            -2300, 800, -0
        ) / 240.0,

        // inv vander 10
        mat3(
            0, 800, -2300,
            0, -300, 925,
            0, 48, -154
        ) / 240.0,

        // inv vander 11
        mat3(
            2950, -1200,  0,
            -1450,   1200, 0,
            269,  -308,   240
        ) / 240.0
    );
}
#endif 
