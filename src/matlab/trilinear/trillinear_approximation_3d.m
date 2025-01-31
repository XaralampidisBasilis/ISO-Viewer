clc, clear

% Define symbolic variables
syms f000 f100 f010 f001 f110 f101 f011 f111 
syms ax ay az bx by bz fa fb x y z t 
assume([f000 f100 f010 f001 f110 f101 f011 f111], 'real');
assume([ax ay az bx by bz fa fb x y z t ], 'real');

f = [f000 f100 f010 f001 f110 f101 f011 f111];

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

% Substitute variables of a line
rx = ax + (bx - ax) * t;
ry = ay + (by - ay) * t;
rz = az + (bz - az) * t;
c = subs(c, [x, y, z], [rx, ry, rz]);

% Special cases that generalize due to symmetries
c = subs(c, [az, by], [0, 0]);
%c = subs(c, [az, bz], [0, 1]);

%% Compute samples
% Extract coefficients with respect to t
[c_coeffs, c_terms] = coeffs(c, t);
c_coeffs = simplify(c_coeffs);

c_samples = [simplify(subs(c, t, 0)), ...
             simplify(subs(c, t, 1))];

disp([c_coeffs(:), c_terms(:)])
disp(c_samples(:))

% Define equality constraints
eqs = [c_samples(1) == fa, ...
       c_samples(2) == fb];

% Solve for two variables in terms of the other two
sol = solve(eqs, [f000, f101]);

% Substitute into the objective function
c_expr = simplify(subs(c_coeffs(1), [f000, f101], [sol.f000, sol.f101]));

% factor restuls to simplify
c_factor = factor(c_expr);
disp(c_factor(:));

[f_coeffs, f_terms] = coeffs(c_factor(3), f);
f_coeffs = simplify(f_coeffs);
disp([f_coeffs(:), f_terms(:)])


%simplify(subs(c_expr, [f10 f01], [1, 1]))