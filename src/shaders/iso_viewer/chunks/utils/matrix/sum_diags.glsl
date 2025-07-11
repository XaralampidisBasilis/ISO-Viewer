#ifndef SUM_DIAGS
#define SUM_DIAGS

// mat2: 2x2 → 3 diagonals
void sum_diags(in mat2 C, out vec4 v) {
    v[0] = C[1][0];            // i - j = -1
    v[1] = C[0][0] + C[1][1];  // i - j =  0
    v[2] = C[0][1];            // i - j = +1
    v[3] = 0.0;
}

// mat3: 3x3 → 5 diagonals
void sum_diags(in mat3 C, out float v[5]) 
{
    v[0] = C[2][0];                     // i - j = -2
    v[1] = C[1][0] + C[2][1];           // i - j = -1
    v[2] = C[0][0] + C[1][1] + C[2][2]; // i - j =  0
    v[3] = C[0][1] + C[1][2];           // i - j = +1
    v[4] = C[0][2];                     // i - j = +2
}

// mat4: 4x4 → 7 diagonals
void sum_diags(in mat4 C, out float v[7]) 
{
    v[0] = C[3][0];                                // i - j = -3
    v[1] = C[2][0] + C[3][1];                      // i - j = -2
    v[2] = C[1][0] + C[2][1] + C[3][2];            // i - j = -1
    v[3] = C[0][0] + C[1][1] + C[2][2] + C[3][3];  // i - j =  0
    v[4] = C[0][1] + C[1][2] + C[2][3];            // i - j = +1
    v[5] = C[0][2] + C[1][3];                      // i - j = +2
    v[6] = C[0][3];                                // i - j = +3
}

// mat3x2: 3 cols, 2 rows → 4 diagonals
void sum_diags(in mat3x2 C, out vec4 v) 
{
    v[0] = C[2][0];            // i - j = -2
    v[1] = C[1][0] + C[2][1];  // i - j = -1
    v[2] = C[0][0] + C[1][1];  // i - j =  0
    v[3] = C[0][1];            // i - j = +1
}

// mat2x3: 2 cols, 3 rows → 4 diagonals
void sum_diags(in mat2x3 C, out vec4 v) 
{
    v[0] = C[1][0];            // i - j = -1
    v[1] = C[0][0] + C[1][1];  // i - j =  0
    v[2] = C[0][1] + C[1][2];  // i - j = +1
    v[3] = C[0][2];            // i - j = +2
}

// mat2x4: 2 cols, 4 rows → 5 diagonals
void sum_diags(in mat2x4 C, out float v[5]) 
{
    v[0] = C[1][0];            // i - j = -1
    v[1] = C[0][0] + C[1][1];  // i - j =  0
    v[2] = C[0][1] + C[1][2];  // i - j = +1
    v[3] = C[0][2] + C[1][3];  // i - j = +2
    v[4] = C[0][3];            // i - j = +3
}

// mat4x2: 4 cols, 2 rows → 5 diagonals
void sum_diags(in mat4x2 C, out float v[5]) 
{
    v[0] = C[3][0];            // i - j = -3
    v[1] = C[2][0] + C[3][1];  // i - j = -2
    v[2] = C[1][0] + C[2][1];  // i - j = -1
    v[3] = C[0][0] + C[1][1];  // i - j =  0
    v[4] = C[0][1];            // i - j = +1
}

// mat3x4: 3 cols, 4 rows → 6 diagonals
void sum_diags(in mat3x4 C, out float v[6]) 
{
    v[0] = C[2][0];                      // i - j = -2
    v[1] = C[1][0] + C[2][1];            // i - j = -1
    v[2] = C[0][0] + C[1][1] + C[2][2];  // i - j =  0
    v[3] = C[0][1] + C[1][2] + C[2][3];  // i - j = +1
    v[4] = C[0][2] + C[1][3];            // i - j = +2
    v[5] = C[0][3];                      // i - j = +3
}

// mat4x3: 4 cols, 3 rows → 6 diagonals
void sum_diags(in mat4x3 C, out float v[6]) 
{
    v[0] = C[3][0];                      // i - j = -3
    v[1] = C[2][0] + C[3][1];            // i - j = -2
    v[2] = C[1][0] + C[2][1] + C[3][2];  // i - j = -1
    v[3] = C[0][0] + C[1][1] + C[2][2];  // i - j =  0
    v[4] = C[0][1] + C[1][2];            // i - j = +1
    v[5] = C[0][2];                      // i - j = +2
}

#endif
