
// From the paper "Real-Time Ray-Casting and Advanced Shading of Discrete Isosurfaces"
// in the 4.1. Differential Surface Properties/Extrinsic curvature


// compute an arbitrary orthogonal tangent space
float l = length(gradient);
vec3 n = normalize(gradient);
vec3 a = normalize(abs(n.x) > abs(n.z) ? vec3(-n.y, n.x, 0.0) : vec3(0.0, -n.z, n.y)); // vec3 a = n.zxy;
vec3 u = normalize(a - dot(a, n) * n);
vec3 v = cross(n, u);

mat2x3 T = mat2x3(u,v);
mat2 A = (transpose(T) * hessian) * T / l;
float t = (A[0][0] + A[1][1]) * 0.5;
float d = determinant(A);

float discriminant = sqrt(t * t - d);
vec2 curvatures = t + discriminant * vec2(-1.0, 1.0);

vec3 e1 = curvatures.x * u + (curvatures.x + A[1][1] - A[0][0]) * v;
vec3 e2 = curvatures.y * u + (curvatures.y + A[1][1] - A[0][0]) * v;
mat2x3 directions = mat2x3(e1, e2);