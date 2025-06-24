#ifndef STRUCT_POLY
#define STRUCT_POLY

struct Poly 
{
    vec4 t0_t1_t2_t3;
    vec4 f0_f1_f2_f3;
    mat4 fxx_fyy_fzz_f;
    mat3x4 gxx_gyy_gzz_g;

    float coeffs[6];  
    float bcoeffs[6];  
    float roots[6];  

    mat3 inv_vander3;
    mat4 inv_vander4;

    mat3 bernstein3;
    mat4 bernstein4;
    mat4x3 bernstein34;
};

Poly poly; 

void set_poly()
{
    poly.t0_t1_t2_t3 = vec4(0, 1, 2, 3) / 3.0;
    poly.f0_f1_f2_f3 = vec4(0);
    poly.fxx_fyy_fzz_f = mat4(0);
    poly.gxx_gyy_gzz_g = mat3x4(0);

    poly.coeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    poly.bcoeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    poly.roots = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);

    poly.inv_vander3 = mat3(
        6, -15, 9,
        -6, 24, -18,
        2, -9, 9
    ) / 2.0;    

    poly.inv_vander4 = mat4(
        2, 0, 0, 0,
        -11, 18, -9, 2,
        18, -45, 36, -9,
        -9, 27, -27, 9
    ) / 2.0;

    poly.bernstein3 = mat3(
        12, -3, 0,
        -12, 12, 0,
        4, -5, 4
    ) / 4.0;

    poly.bernstein4 = mat4(
        6, 0, 0, 0,
        -5, 18, -9, 2,
        2, -9, 18, -5,
        0, 0, 0, 6
    ) / 6.0;

    poly.bernstein34 = mat4x3(
        10, 4, 1,
        6, 6, 3,
        3, 6, 6, 
        1, 4, 10
    ) / 10.0;
}

#endif 
