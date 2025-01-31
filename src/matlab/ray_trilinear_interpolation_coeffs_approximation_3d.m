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

% Substitute variables of a line
rx = ax + (bx - ax) * t;
ry = ay + (by - ay) * t;
rz = az + (bz - az) * t;
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
% c = simplify(subs(c, [f000 f001 f010 f100 f011 f101 f110 f111], [ ...
%     d000, ...
%     d001 + d000, ...
%     d010 + d000, ...
%     d100 + d000, ...
%     d011 + d001 + d010 + d000, ...
%     d101 + d001 + d100 + d000, ...
%     d110 + d010 + d100 + d000, ...
%     d111 + d011 + d101 + d110 + d100 + d010 + d001 + d000, ...
% ]));

%% Compute samples

weights = [0/3, 1/3, 2/3 3/3];
vand = vander(weights);
inv_vand = inv(vand);

% Extract coefficients with respect to t
[c_coeffs, c_terms] = coeffs(c, t);
c_coeffs = simplify(c_coeffs);

c_samples = [ ...
    simplify(subs(c, t, weights(1))), ...
    simplify(subs(c, t, weights(2))), ...
    simplify(subs(c, t, weights(3))), ...
    simplify(subs(c, t, weights(4))), ...
];

error = simplify(c_coeffs(:) - inv_vand * c_samples(:));
disp([c_coeffs(:), c_terms(:)])
disp(c_samples(:))
disp(error)




%% Special case ay = 0, bx = 0
syms s0 s1 
assume([s0 s1], 'real')

f = [f000 f100 f010 f001 f110 f101 f011 f111];
w0 = simplify(coeffs(c_samples(1), f));
w1 = simplify(coeffs(c_samples(4), f));
w  = simplify(coeffs(c_coeffs(1), f));

% Define equality constraints
eqs = [dot(w0, f) == s0, ...
       dot(w1, f) == s1];

% Solve for two variables in terms of the other
sol = solve(eqs, [f100, f010]);

% Substitute into the objective function
c_expr = simplify(subs(dot(w, f), [f100, f010], [sol.f100, sol.f010]));
%c_expr = simplify(subs(c_expr, [ax, by], [0, 0]));

c_factor = factor(c_expr);
disp(c_factor(:))

[f_coeffs, f_terms] = coeffs(c_factor(2), f);
disp([f_coeffs(:), f_terms(:)])

simplify(subs(c_expr, [f000 f001 f110 f101 f011 f111], [1 0 1 1 1 1]))
