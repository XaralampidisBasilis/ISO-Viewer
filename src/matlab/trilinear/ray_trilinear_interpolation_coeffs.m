clc, clear

% Define symbolic variables
syms f000 f100 f010 f001 f110 f101 f011 f111 
syms d000 d100 d010 d001 d110 d101 d011 d111 
syms ax ay az bx by bz t 
syms x y z
assume([f000 f100 f010 f001 f110 f101 f011 f111 ...
        d000 d100 d010 d001 d110 d101 d011 d111 ...
        ax ay az bx by bz t ...
        x y z], 'real')

% Define the trilinear coefficients
c000 = (1 - x) * (1 - y) * (1 - z) * f000;
c100 = (0 + x) * (1 - y) * (1 - z) * f100;
c010 = (1 - x) * (0 + y) * (1 - z) * f010;
c001 = (1 - x) * (1 - y) * (0 + z) * f001;
c011 = (1 - x) * (0 + y) * (0 + z) * f011;
c101 = (0 + x) * (1 - y) * (0 + z) * f101;
c110 = (0 + x) * (0 + y) * (1 - z) * f110;
c111 = (0 + x) * (0 + y) * (0 + z) * f111;

% Combine all coefficients
c = c000 + c100 + c010 + c001 + c011 + c101 + c110 + c111;

% Substitute variables
rx = ax + bx * t;
ry = ay + by * t;
rz = az + bz * t;
c = subs(c, [x, y, z], [rx, ry, rz]);

% Extract coefficients with respect to t o, n
[c_coeffs, c_terms] = coeffs(c, [t, ax, ay, az, bx, by, bz]);
c_coeffs = simplify(c_coeffs);
f_coeffs = unique(c_coeffs);

disp([c_coeffs(:), c_terms(:)])

%% Extract coefficients with respect to t o, n
[c_coeffs, c_terms] = coeffs(c, t);
c_coeffs = simplify(c_coeffs);
f_coeffs = unique(c_coeffs);

disp([c_coeffs(:), c_terms(:)])

%% Simplification patterns

% Mapping
% f000 = d000;
% f001 = d001 + d000;
% f010 = d010 + d000;
% f100 = d100 + d000;
% f011 = d011 + d001 + d010 + d000;
% f101 = d101 + d001 + d100 + d000;
% f110 = d110 + d010 + d100 + d000;
% f111 = d111 + d011 + d101 + d110 + d100 + d010 + d001 + d000;

% Apply mapping 
a = simplify(subs(c, [f000 f001 f010 f100 f011 f101 f110 f111], [ ...
    d000, ...
    d001 + d000, ...
    d010 + d000, ...
    d100 + d000, ...
    d011 + d001 + d010 + d000, ...
    d101 + d001 + d100 + d000, ...
    d110 + d010 + d100 + d000, ...
    d111 + d011 + d101 + d110 + d100 + d010 + d001 + d000, ...
]));

[a_coeffs, a_terms] = coeffs(a, [t, bx, by, bz, ax, ay, az]);

disp([a_coeffs(:), a_terms(:)])

%% Efficient calculation of coefficients for glsl implementation

% Reverse Mapping
d000 = f000;
d001 = f001 - f000;
d010 = f010 - f000;
d100 = f100 - f000;
d011 = f000 - f001 - f010 + f011;
d101 = f000 - f001 - f100 + f101;
d110 = f000 - f010 - f100 + f110;
d111 = f001 - f000 + f010 - f011 + f100 - f101 - f110 + f111;

cubic_coeffs_1 = bx * by * bz * d111;

cubic_coeffs_2 = bx * by * (az * d111 + d110) ...
               + by * bz * (ax * d111 + d011) ...
               + bx * bz * (ay * d111 + d101);

cubic_coeffs_3 = bx * (ay * az * d111 + ay * d110 + az * d101 + d100) ...
               + by * (ax * az * d111 + ax * d110 + az * d011 + d010) ...
               + bz * (ax * ay * d111 + ax * d101 + ay * d011 + d001);

cubic_coeffs_4 = ax * ay * az * d111 ...
                    + ax * ay * d110 ...
                    + ax * az * d101 ...
                    + ay * az * d011 ...
                         + ax * d100 ...
                         + ay * d010 ...
                         + az * d001 ...
                              + d000;

c_result = dot([cubic_coeffs_1, cubic_coeffs_2, cubic_coeffs_3, cubic_coeffs_4], [t^3, t^2, t^1, t^0]);

% Check condition to be zero
disp(simplify(c_result - c))

%% GLSL CODE

% // Compute vertex value differences to simplify computations
% float F[8];
% F[0] = f[0];
% F[1] = f[1] - f[0];
% F[2] = f[2] - f[0];
% F[3] = f[3] - f[0];
% F[4] = f[4] - f[3] - f[2] + f[0];
% F[5] = f[5] - f[3] - f[1] + f[0];
% F[6] = f[6] - f[2] - f[1] + f[0];
% F[7] = f[7] - f[6] - f[5] - f[4] + f[3] + f[2] + f[1] - f[0]; 

% // Compute grouping vectors for optimization
% vec4 F1 = vec4(F[1], F[2], F[3], F[7]);
% vec4 F2 = vec4(F[4], F[5], F[6], F[7]);
% vec4 O1 = vec4(ray_origin, 1.0);
% vec4 D1 = vec4(ray_direction, 1.0);
% vec4 O2 = O1.yxxw * O1.zzyw;
% vec4 D2 = D1.yxxw * D1.zzyw;

% // Compute cubic coeffs with grouped vector operations
% vec4 coeffs = vec4(

%     prod(O1) * F[7] + F[0]
%         + dot(F1.xyz, O1.xyz) 
%         + dot(F2.xyz, O2.xyz),

%     dot(D1.xyz, vec3(
%         dot(F1.wx, O2.xw) + dot(F2.zy, O1.yz), 
%         dot(F1.wy, O2.yw) + dot(F2.zx, O1.xz), 
%         dot(F1.wz, O2.zw) + dot(F2.yx, O1.xy))),

%     dot(D2.xyz, vec3(
%         dot(F2.wx, O1.xw), 
%         dot(F2.wy, O1.yw), 
%         dot(F2.wz, O1.zw))),

%     prod(D1) * F[7]
% );

% return coeffs;

%% Verify glsl code with homeomorphic matlab code
f = [f000 f100 f010 f001 f011 f101 f110 f111];
d = [d000 d100 d010 d001 d011 d101 d110 d111];

F = sym(zeros(1, 8));
F(1) = f(1);
F(2) = f(2) - f(1);
F(3) = f(3) - f(1);
F(4) = f(4) - f(1);
F(5) = f(5) - f(4) - f(3) + f(1);
F(6) = f(6) - f(4) - f(2) + f(1);
F(7) = f(7) - f(3) - f(2) + f(1);
F(8) = f(8) - f(7) - f(6) - f(5) + f(4) + f(3) + f(2) - f(1);

% Step 2: Compute grouping vectors for optimization
F1 = [F(2), F(3), F(4), F(8)]; % Group F1
F2 = [F(5), F(6), F(7), F(8)]; % Group F2
O1 = [ax, ay, az, 1.0]; % Extend ray_origin with 1
D1 = [bx, by, bz, 1.0]; % Extend ray_direction with 1
O2 = [O1(2)*O1(3), O1(1)*O1(3), O1(1)*O1(2), O1(4)];
D2 = [D1(2)*D1(3), D1(1)*D1(3), D1(1)*D1(2), D1(4)];

% Step 3: Compute cubic coefficients with grouped operations
cubic_coeffs = sym(zeros(1, 4));

cubic_coeffs(1) = prod(O1) * F(8) + F(1)  ... 
    + dot(F1(1:3), O1(1:3)) ...
    + dot(F2(1:3), O2(1:3));

cubic_coeffs(2) = dot(D1(1:3), [ ... 
    dot(F2([3,2]), O1([2,3])) + dot(F1([4,1]), O2([1,4])); ...
    dot(F2([3,1]), O1([1,3])) + dot(F1([4,2]), O2([2,4])); ...
    dot(F2([2,1]), O1([1,2])) + dot(F1([4,3]), O2([3,4])) ...
]);

cubic_coeffs(3) = dot(D2(1:3), [ ...
    dot(F2([4,1]), O1([1,4])); ...
    dot(F2([4,2]), O1([2,4])); ...
    dot(F2([4,3]), O1([3,4])) ...
]);

cubic_coeffs(4) = prod(D1) * F(8);

% Display coefficients
c_result = dot(cubic_coeffs, [t^0, t^1, t^2, t^3]);
disp(simplify(c_result - c))
