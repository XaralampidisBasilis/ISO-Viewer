clc
clear

% Define symbolic variables
syms x f0 f1 d0 d1

f = f0 * (1-x) + f1 * x;
d = d0 * (1-x) + d1 * x;
p = f + d * (x^2 - x)/2;

[p_coeffs, p_terms] = coeffs(p, x);
p_coeffs = simplify(p_coeffs);
disp([p_coeffs(:), p_terms(:)])


m = [1, 1, 1, 1; 0, 1/3, 2/3, 1; 0, 0, 1/3, 1; 0, 0, 0, 1];
b = m * p_coeffs.';