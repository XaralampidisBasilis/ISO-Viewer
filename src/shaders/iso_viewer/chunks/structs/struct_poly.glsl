#ifndef STRUCT_POLY
#define STRUCT_POLY

struct Poly 
{
    bool is_cubic;
    vec4 t0_t1_t2_t3;
    vec4 f0_f1_f2_f3;
    vec4 r0_r1_r2_r3;
    mat4 fxx_fyy_fzz_f;
    mat3x4 gxx_gyy_gzz_g;

    float coeffs[6];  
    float bcoeffs[6];  
    float roots[6];  

    mat3 inv_vander3;
    mat4 inv_vander4;
    mat3 transp_inv_vander3;
    mat4 transp_inv_vander4;
};

Poly poly; 

void set_poly()
{
    poly.t0_t1_t2_t3 = vec4(0, 1, 2, 3) / 3.0;
    poly.f0_f1_f2_f3 = vec4(0);
    poly.r0_r1_r2_r3 = vec4(0);
    poly.fxx_fyy_fzz_f = mat4(0);
    poly.gxx_gyy_gzz_g = mat3x4(0);

    poly.coeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    poly.bcoeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    poly.roots = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);

    poly.inv_vander3 = mat3(
        6, -6, 2,
        -15, 24, -9,
        9, -18, 9
    ) / 2.0;    
    poly.inv_vander4 = mat4(
        2, 0, 0, 0,
        -11, 18, -9, 2,
        18, -45, 36, -9,
        -9, 27, -27, 9
    ) / 2.0;
    poly.transp_inv_vander3 = mat3(
        6, -15, 9,
        -6, 24, -18,
        2, -9, 9
    ) / 2.0;    
    poly.transp_inv_vander4 = mat4(
        2, -11, 18, -9,
        0, 18, -45, 27,
        0, -9, 36, -27,
        0, 2, -9, 9 
    ) / 2.0;
}
#endif 
