clc, clear

% Define symbolic variables
syms f000 f100 f010 f001 f110 f101 f011 f111 
syms d000 d100 d010 d001 d110 d101 d011 d111 
syms ox oy oz nx ny nz t 
syms x y z
assume([f000 f100 f010 f001 f110 f101 f011 f111 ...
        d000 d100 d010 d001 d110 d101 d011 d111 ...
        ox oy oz nx ny nz t ...
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
rx = ox + nx * t;
ry = oy + ny * t;
rz = oz + nz * t;
c = subs(c, [x, y, z], [rx, ry, rz]);

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

% Reverse Mapping
% d000 = f000;
% d001 = f001 - f000;
% d010 = f010 - f000;
% d100 = f100 - f000;
% d011 = f000 - f001 - f010 + f011;
% d101 = f000 - f001 - f100 + f101;
% d110 = f000 - f010 - f100 + f110;
% d111 = f001 - f000 + f010 - f011 + f100 - f101 - f110 + f111;

% Apply mapping 
c = simplify(subs(c, [f000 f001 f010 f100 f011 f101 f110 f111], [ ...
    d000, ...
    d001 + d000, ...
    d010 + d000, ...
    d100 + d000, ...
    d011 + d001 + d010 + d000, ...
    d101 + d001 + d100 + d000, ...
    d110 + d010 + d100 + d000, ...
    d111 + d011 + d101 + d110 + d100 + d010 + d001 + d000, ...
]));

% Extract coefficients with respect to t
[c_coeffs, c_terms] = coeffs(c, t);
c_coeffs = simplify(c_coeffs);

disp([c_coeffs(:), c_terms(:)])

%% 
syms t0 t1 t2
assume([t0 t1 t2], 'real')

T34 = [1 t0 t0^2 t0^3; 1 t1 t1^2 t1^3; 1 t2 t2^2 t2^3];
T33 = [1 t0 t0^2; 1 t1 t1^2; 1 t2 t2^2];
C41 = c_coeffs(:);

Q31 = T33 \ (T34 * C41);
Q31 = simplify(Q31);

error = dot([1 t t^2 t^3], C41) - dot([1 t t^2], Q31);
error = simplify(error);

%% Error amplitude

amplitude = (d000 + d100*ox + d010*oy + d001*oz + d110*ox*oy + d101*ox*oz + d011*oy*oz + d111*ox*oy*oz);
