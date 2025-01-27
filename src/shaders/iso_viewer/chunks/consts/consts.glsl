const ivec2 binary_offset = ivec2(0, 1);
const ivec3 binary_offsets[8] = ivec3[8]
(
    binary_offset.xxx, binary_offset.yxx, 
    binary_offset.xyx, binary_offset.xxy, 
    binary_offset.xyy, binary_offset.yxy,
    binary_offset.yyx, binary_offset.yyy 
);

const vec2 center_offset = vec2(-0.5, 0.5);
const vec3 center_offsets[8] = vec3[8]
(
    center_offset.xxx, center_offset.yxx, 
    center_offset.xyx, center_offset.xxy, 
    center_offset.xyy, center_offset.yxy,
    center_offset.yyx, center_offset.yyy 
);

const vec4 sample_weights4 = vec4
(
    0.0, 
    1.0/3.0, 
    2.0/3.0, 
    1.0
);
const mat4 vandermonde_matrix4 = mat4
(
     1.0, -5.5,   9.0,   -4.5,
     0.0,  9.0, -22.5,   13.5,
     0.0, -4.5, 18.0, -13.5,
    0.0, 1.0, -4.5,   4.5 
);


#ifndef MAX_CELL_COUNT
int MAX_CELL_COUNT = 1000;
#endif

#ifndef MAX_BLOCK_COUNT
int MAX_BLOCK_COUNT = 1000;
#endif
