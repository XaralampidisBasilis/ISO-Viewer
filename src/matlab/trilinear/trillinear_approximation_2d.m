clc, clear

% Define symbolic variables
syms f00 f10 f01 f11 
syms ax ay bx by t fa fb
syms x y
assume([f00 f10 f01 f11, ...
        ax ay bx by t fa fb, ...
        x y], 'real')
    
f = [f00 f10 f01 f11];

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

% Special cases that generalize due to symmetries
%c = subs(c, [ay, bx], [0, 1]);
c = subs(c, [ay, by], [0, 1]);

% Extract coefficients with respect to t
[c_coeffs, c_terms] = coeffs(c, t);
c_coeffs = simplify(c_coeffs);
c_samples = [simplify(subs(c, t, 0)), simplify(subs(c, t,1))];

disp([c_coeffs(:), c_terms(:)])
disp(c_samples(:))


%%
% Define equality constraints
eqs = [c_samples(1) == fa, ...
       c_samples(2) == fb];

% Solve for two variables in terms of the other two
sol = solve(eqs, [f00, f11]);

% Substitute into the objective function
c_expr = simplify(subs(c_coeffs(1), [f00, f11], [sol.f00, sol.f11]));

[f_coeffs, f_terms] = coeffs(c_expr, [f10 f01]);
f_coeffs = simplify(f_coeffs);

disp([f_coeffs(:), f_terms(:)])
simplify(subs(c_expr, [f10 f01], [1, 1]))