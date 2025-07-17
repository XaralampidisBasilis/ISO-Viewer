#ifndef STRUCT_QUINTIC
#define STRUCT_QUINTIC

struct Quintic 
{
    vec4 points;
    vec4 values;
    vec4 residuals;
    float coeffs[6];  
    float bcoeffs[6];  
    float roots[6];  

    mat4 fxx_fyy_fzz_f;
    mat4x3 gx_gy_gz_g;

    mat3 inv_vander3;
    mat4 inv_vander4;

    mat3 bernstein3;
    mat4 bernstein4;
    mat4x3 bernstein34;
};

Quintic quintic; 

void set_quintic()
{
    quintic.points = vec4(0, 1, 2, 3) / 3.0;
    quintic.residuals = vec4(0);
    quintic.coeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.bcoeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.roots = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);

    quintic.fxx_fyy_fzz_f = mat4(0);
    quintic.gx_gy_gz_g = mat4x3(
        0, 0, 0,
        0, 0, 0,
        0, 0, 0,
        1, 1, 1
    );

    quintic.inv_vander3 = mat3(
        6, -15, 9,
        -6, 24, -18,
        2, -9, 9
    ) / 2.0;    

    quintic.inv_vander4 = mat4(
        2, 0, 0, 0,
        -11, 18, -9, 2,
        18, -45, 36, -9,
        -9, 27, -27, 9
    ) / 2.0;

    quintic.bernstein3 = mat3(
        12, -3, 0,
        -12, 12, 0,
        4, -5, 4
    ) / 4.0;

    quintic.bernstein4 = mat4(
        6, 0, 0, 0,
        -5, 18, -9, 2,
        2, -9, 18, -5,
        0, 0, 0, 6
    ) / 6.0;

    quintic.bernstein34 = mat4x3(
        10, 4, 1,
        6, 6, 3,
        3, 6, 6, 
        1, 4, 10
    ) / 10.0;
}

#endif 
