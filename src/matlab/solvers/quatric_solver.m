clear, clc
syms a b c d e p q r x y z
assume([a b c d e p q r x y z], 'real')
 
f = dot([x^4, x^3, x^2, x, 1], [1, 4 * b, c, d, e]);
f = simplify(coeffs(subs(f, x, y - b), y, 'All'));
disp(f')

%p = (8*c - 3 * b^2) / 8;
%q = (8*d - 4*c*b + b^3) / 8;
%r = (256*e - 64*d*b +16*c*b^2 - 3*b^4) / 256;

p = simplify(f(3));
q = simplify(f(4));
r = simplify(f(5));
