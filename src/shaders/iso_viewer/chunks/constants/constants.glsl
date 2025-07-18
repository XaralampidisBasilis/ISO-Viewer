
const mat4 cubic_inv_vander = mat4(
    2, -11, 18, -9,
    0, 18, -45, 27,
    0, -9, 36, -27,
    0, 2, -9, 9 
) / 2.0;

const mat4 cubic_sample_bernstein = mat4(
    6, -5, 2, 0,
    0, 18, -9, 0,
    0, -9, 18, 0,
    0, 2, -5, 6
) / 6.0;

const mat3 quintic_inv_vander3 = mat3(
    6, -15, 9,
    -6, 24, -18,
    2, -9, 9
) / 2.0;    

const mat4 quintic_inv_vander4 = mat4(
    2, 0, 0, 0,
    -11, 18, -9, 2,
    18, -45, 36, -9,
    -9, 27, -27, 9
) / 2.0;

const mat3 quintic_bernstein3 = mat3(
    12, -3, 0,
    -12, 12, 0,
    4, -5, 4
) / 4.0;

const mat4 quintic_bernstein4 = mat4(
    6, 0, 0, 0,
    -5, 18, -9, 2,
    2, -9, 18, -5,
    0, 0, 0, 6
) / 6.0;

const mat4x3 quintic_bernstein34 = mat4x3(
    10, 4, 1,
    6, 6, 3,
    3, 6, 6, 
    1, 4, 10
) / 10.0;
