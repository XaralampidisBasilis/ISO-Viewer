clc, clear

% Define symbolic variables
syms f00 f10 f01 f11 
syms d00 d10 d01 d11 
syms ax ay bx by t
syms x y
assume([f00 f10 f01 f11, ...
        d00 d10 d01 d11, ...
        ax ay bx by t, ...
        x y], 'real')

% Define the trilinear coefficients
c00 = (1 - x) * (1 - y) * f00;
c10 = (0 + x) * (1 - y) * f10;
c01 = (1 - x) * (0 + y) * f01;
c11 = (0 + x) * (0 + y) * f11;

% Combine all coefficients
c = c00 + c10 + c01 + c11;

% Substitute variables of a line
rx = ax + (bx - ax) * t;
ry = ay + (by - ay) * t;
c = simplify(subs(c, [x, y], [rx, ry]));

%% Simplification patterns

% Mapping
% f00 = d00;
% f01 = d01 + d00;
% f10 = d10 + d00;
% f11 = d11 + d10 + d01 + d00;

% Reverse Mapping
% d00 = f00;
% d01 = f01 - f00;
% d10 = f10 - f00;
% d11 = f01 - f10 - f11 + f00;

% Apply mapping 
% c = simplify(subs(c, [f00 f01 f10 f11], [ ...
%     d00, ...
%     d01 + d00, ...
%     d10 + d00, ...
%     d11 + d10 + d01 + d00, ...
% ]));

%% Compute samples

weights = [0/2, 1/2, 2/2];
vand = vander(weights);
inv_vand = inv(vand);

% Extract coefficients with respect to t
[c_coeffs, c_terms] = coeffs(c, t);
c_coeffs = simplify(c_coeffs);

c_samples = [ ...
    simplify(subs(c, t, weights(1))), ...
    simplify(subs(c, t, weights(2))), ...
    simplify(subs(c, t, weights(3))), ...
];

error = simplify(c_coeffs(:) - inv_vand * c_samples(:));
disp([c_coeffs(:), c_terms(:)])
disp(c_samples(:))
disp(error)

%% Symbolic solver

% Define variables as vectors
syms s0 s1 
assume([s0 s1], 'real')

f = [f00 f10 f01 f11];
w0 = simplify(coeffs(c_samples(1), f));
w1 = simplify(coeffs(c_samples(3), f));
w  = simplify(coeffs(c_coeffs(1), f));

% Define equality constraints
eqs = [dot(w0, f) == s0, ...
       dot(w1, f) == s1];

% Solve for two variables in terms of the other two
sol = solve(eqs, [f00, f11]);

% Substitute into the objective function
c_expr = simplify(subs(dot(w, f), [f00, f11], [sol.f00, sol.f11]));
c_factor = factor(c_expr);

%% Special case 
syms s0 s1 
assume([s0 s1], 'real')

f = [f00 f10 f01 f11];
w0 = simplify(coeffs(c_samples(1), f));
w1 = simplify(coeffs(c_samples(3), f));
w  = simplify(coeffs(c_coeffs(1), f));

% Define equality constraints
eqs = [dot(w0, f) == s0, ...
       dot(w1, f) == s1];

% Solve for two variables in terms of the other two
sol = solve(eqs, [f10, f01]);

% Substitute into the objective function
c_expr = simplify(subs(dot(w, f), [f10, f01], [sol.f10, sol.f01]));
c_expr = simplify(subs(c_expr, [ax, by], [0, 0]));

