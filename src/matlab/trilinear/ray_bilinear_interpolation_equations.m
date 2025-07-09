clc, clear

% Define symbolic variables
syms f00 f10 f01 f11 
assume([f00 f10 f01 f11], 'real');

syms d00 d10 d01 d11 
assume([d00 d10 d01 d11], 'real');

syms ax ay bx by t 
assume([ax ay bx by t], 'real');
syms x y
assume([x y], 'real');

% Define line segment
rx = ax + bx * t;
ry = ay + by * t;

% Define multiplicative factors
g00 = (1 - x) * (1 - y);
g10 = (0 + x) * (1 - y);
g01 = (1 - x) * (0 + y);
g11 = (0 + x) * (0 + y);

% Combine multiplicative factors to a vector
g = [g00; g10; g01; g11];
f = [f00; f10; f01; f11];
d = [d00; d10; d01; d11];

% Compute trilinear interpolant
c = dot(g, f);
c = subs(c, [x, y], [rx, ry]);
c = simplify(c);

% Extract coefficients with respect to t
[c_coeffs, t_terms] = coeffs(c, t);
c_coeffs = simplify(c_coeffs);
f_coeffs = unique(c_coeffs);
disp([c_coeffs(:), t_terms(:)]);

%% Mapping
% Define the 8x8 transformation matrix T, f = T * d
T = [
    1 0 0 0 0 0 0 0;  % f000 = d000
    1 1 0 0 0 0 0 0;  % f100 = d100 + d000
    1 0 1 0 0 0 0 0;  % f010 = d010 + d000
    1 0 0 1 0 0 0 0;  % f001 = d001 + d000
    1 0 1 1 1 0 0 0;  % f011 = d011 + d001 + d010 + d000
    1 1 0 1 0 1 0 0;  % f101 = d101 + d001 + d100 + d000
    1 1 1 0 0 0 1 0;  % f110 = d110 + d010 + d100 + d000
    1 1 1 1 1 1 1 1;  % f111 = d111 + d011 + d101 + d110 + d100 + d010 + d001 + d000
];

a = simplify(subs(c, f, T * d));
[a_coeffs, t_terms] = coeffs(a, t);
a_coeffs = simplify(a_coeffs);

disp([a_coeffs(:), t_terms(:)]);


%% Efficient calculation of coefficients for glsl implementation
% Define the inverse transformation matrix T_inv, d = T_inv * f
T_inv = [
    1  0  0  0  0  0  0  0;   % d000 = f000
   -1  1  0  0  0  0  0  0;   % d100 = f100 - f000
   -1  0  1  0  0  0  0  0;   % d010 = f010 - f000
   -1  0  0  1  0  0  0  0;   % d001 = f001 - f000
    1  0 -1 -1  1  0  0  0;   % d011 = f000 - f001 - f010 + f011
    1 -1  0 -1  0  1  0  0;   % d101 = f000 - f001 - f100 + f101
    1 -1 -1  0  0  0  1  0;   % d110 = f000 - f010 - f100 + f110
   -1  1  1  1 -1 -1 -1  1;   % d111 = f001 - f000 + f010 - f011 + f100 - f101 - f110 + f111
];

% Define the transformation matrix M, coeffs = M * d
M = [
    0, 0,  0,  0,   0,             0,             0,             bx*by*bz;
    0, 0,  0,  0,   by*bz,         bx*bz,         bx*by,         bx*by*az + by*bz*ax + bx*bz*ay;
    0, bx, by, bz,  by*az + bz*ay, bx*az + bz*ax, bx*ay + by*ax, bx*ay*az + by*ax*az + bz*ax*ay;
    1, ax, ay, az,  ay*az,         ax*az,         ax*ay,         ax*ay*az
];
aa_coeffs = sym(zeros(4,1));

aa_coeffs(1) = bx * by * bz * d111;

aa_coeffs(2) = bx * by * (az * d111 + d110) ...
             + by * bz * (ax * d111 + d011) ...
             + bx * bz * (ay * d111 + d101);

aa_coeffs(3) = bx * (ay * az * d111 + ay * d110 + az * d101 + d100) ...
             + by * (ax * az * d111 + ax * d110 + az * d011 + d010) ...
             + bz * (ax * ay * d111 + ax * d101 + ay * d011 + d001);

aa_coeffs(4) = ax * ay * az * d111 ...
                  + ax * ay * d110 ...
                  + ax * az * d101 ...
                  + ay * az * d011 ...
                       + ax * d100 ...
                       + ay * d010 ...
                       + az * d001 ...
                            + d000;

aa = simplify(dot(M * d, [t^3, t^2, t^1, t^0]));
cc = simplify(subs(aa, d, T_inv * f));
disp(simplify(aa - a))
disp(simplify(cc - c))

%%
syms px py pz 
assume([px py pz], 'real');

syms ux uy uz 
assume([ux uy uz], 'real');

% px = ax + bx*t
% py = ay + by*t
% pz = az + bz*t

% This describes the following equation f(t) = c0t^0 + c1t^1 + c2t^2 + c3t^3 = dot(M(t), d)
Mt = simplify([t^3, t^2, t, 1] * M);
Mt = simplify(subs(Mt, [ax, ay, az], [px - bx*t, py - by*t, pz - bz*t]));

% Since c3 = bx*by*bz * d111 we need to find bounds for d111
% We have f(t) = dot(M(t), d) =>
% px*py*pz * d111 = f(t) - dot(M0(t), d0), where M0, d0 are the rest
% We can substitute d0 = T0_inv * fw0
% So we have px*py*pz * d111 = f(t) - M0 * T0_inv = f(t) - W0 * f
M0 = Mt(1:end-1);
T0_inv = T_inv(1:end-1,:);
W0 = M0 * T0_inv;


%% Final maximal absolute bounds to the cubic coefficient based on a taken sample
% p 3d point, f the sampled value there, c is the max bound for the coefficient c3
v = abs(pout - pin);
p = max(p, 1 - p);
f = max(f, 1 - f);
c = (f + dot(p * 2 - 1, p.yzx)) * prod(v) / prod(p); 
