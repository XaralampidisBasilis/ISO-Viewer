
% Define symbolic variables
syms x y z
assume([x y z], 'real')
assume(0 <= x & x <= 1)
assume(0 <= y & y <= 1)
assume(0 <= z & z <= 1)

syms f000 f100 f010 f001 f011 f101 f110 f111 
assume([f000 f100 f010 f001 f011 f101 f110 f111], 'real')

% Define the trilinear coefficients
F000 = (1 - x) * (1 - y) * (1 - z) * f000;
F100 = (0 + x) * (1 - y) * (1 - z) * f100;
F010 = (1 - x) * (0 + y) * (1 - z) * f010;
F001 = (1 - x) * (1 - y) * (0 + z) * f001;
F011 = (1 - x) * (0 + y) * (0 + z) * f011;
F101 = (0 + x) * (1 - y) * (0 + z) * f101;
F110 = (0 + x) * (0 + y) * (1 - z) * f110;
F111 = (0 + x) * (0 + y) * (0 + z) * f111;
F = simplify(F000 + F100 + F010 + F001 + F011 + F101 + F110 + F111);

syms fxx000 fxx100 fxx010 fxx001 fxx011 fxx101 fxx110 fxx111 
assume([fxx000 fxx100 fxx010 fxx001 fxx011 fxx101 fxx110 fxx111], 'real')

% Define the trilinear coefficients
FXX000 = 3 * (0 + x) * (1 - x) * (1 - x) * (1 - y) * (1 - z) * (- fxx000 / 2 / 3);
FXX100 = 3 * (0 + x) * (1 - x) * (0 + x) * (1 - y) * (1 - z) * (- fxx100 / 2 / 3);
FXX010 = 3 * (0 + x) * (1 - x) * (1 - x) * (0 + y) * (1 - z) * (- fxx010 / 2 / 3);
FXX001 = 3 * (0 + x) * (1 - x) * (1 - x) * (1 - y) * (0 + z) * (- fxx001 / 2 / 3);
FXX011 = 3 * (0 + x) * (1 - x) * (1 - x) * (0 + y) * (0 + z) * (- fxx011 / 2 / 3);
FXX101 = 3 * (0 + x) * (1 - x) * (0 + x) * (1 - y) * (0 + z) * (- fxx101 / 2 / 3);
FXX110 = 3 * (0 + x) * (1 - x) * (0 + x) * (0 + y) * (1 - z) * (- fxx110 / 2 / 3);
FXX111 = 3 * (0 + x) * (1 - x) * (0 + x) * (0 + y) * (0 + z) * (- fxx111 / 2 / 3);
FXX = simplify(FXX000 + FXX100 + FXX010 + FXX001 + FXX011 + FXX101 + FXX110 + FXX111);

syms fyy000 fyy100 fyy010 fyy001 fyy011 fyy101 fyy110 fyy111 
assume([fyy000 fyy100 fyy010 fyy001 fyy011 fyy101 fyy110 fyy111], 'real')

% Define the trilinear coefficients
FYY000 = 3 * (y + 0) * (1 - y) * (1 - x) * (1 - y) * (1 - z) *  (- fyy000 / 2 / 3);
FYY100 = 3 * (y + 0) * (1 - y) * (0 + x) * (1 - y) * (1 - z) *  (- fyy100 / 2 / 3);
FYY010 = 3 * (y + 0) * (1 - y) * (1 - x) * (0 + y) * (1 - z) *  (- fyy010 / 2 / 3);
FYY001 = 3 * (y + 0) * (1 - y) * (1 - x) * (1 - y) * (0 + z) *  (- fyy001 / 2 / 3);
FYY011 = 3 * (y + 0) * (1 - y) * (1 - x) * (0 + y) * (0 + z) *  (- fyy011 / 2 / 3);
FYY101 = 3 * (y + 0) * (1 - y) * (0 + x) * (1 - y) * (0 + z) *  (- fyy101 / 2 / 3);
FYY110 = 3 * (y + 0) * (1 - y) * (0 + x) * (0 + y) * (1 - z) *  (- fyy110 / 2 / 3);
FYY111 = 3 * (y + 0) * (1 - y) * (0 + x) * (0 + y) * (0 + z) *  (- fyy111 / 2 / 3);
FYY = simplify(FYY000 + FYY100 + FYY010 + FYY001 + FYY011 + FYY101 + FYY110 + FYY111);

syms fzz000 fzz100 fzz010 fzz001 fzz011 fzz101 fzz110 fzz111 
assume([fzz000 fzz100 fzz010 fzz001 fzz011 fzz101 fzz110 fzz111], 'real')

% Define the trilinear coefficients
FZZ000 = 3 * (z + 0) * (1 - z) * (1 - x) * (1 - y) * (1 - z) * (- fzz000 / 2 / 3);
FZZ100 = 3 * (z + 0) * (1 - z) * (0 + x) * (1 - y) * (1 - z) * (- fzz100 / 2 / 3);
FZZ010 = 3 * (z + 0) * (1 - z) * (1 - x) * (0 + y) * (1 - z) * (- fzz010 / 2 / 3);
FZZ001 = 3 * (z + 0) * (1 - z) * (1 - x) * (1 - y) * (0 + z) * (- fzz001 / 2 / 3);
FZZ011 = 3 * (z + 0) * (1 - z) * (1 - x) * (0 + y) * (0 + z) * (- fzz011 / 2 / 3);
FZZ101 = 3 * (z + 0) * (1 - z) * (0 + x) * (1 - y) * (0 + z) * (- fzz101 / 2 / 3);
FZZ110 = 3 * (z + 0) * (1 - z) * (0 + x) * (0 + y) * (1 - z) * (- fzz110 / 2 / 3);
FZZ111 = 3 * (z + 0) * (1 - z) * (0 + x) * (0 + y) * (0 + z) * (- fzz111 / 2 / 3);
FZZ = simplify(FZZ000 + FZZ100 + FZZ010 + FZZ001 + FZZ011 + FZZ101 + FZZ110 + FZZ111);

% Combine all terms
C = F + FXX + FYY + FZZ;

% Extract coefficients with respect to x y z
[C_coeffs, C_terms] = coeffs(C, [x y z]);
C_coeffs = simplify(C_coeffs);
disp([C_coeffs(:), C_terms(:)])

% Extract derivatives with respect to x y z
Cx = simplify(diff(C, x));
[Cx_coeffs, Cx_terms] = coeffs(Cx, [x y z]);
disp([Cx_coeffs(:), Cx_terms(:)])

Cy = simplify(diff(C, y));
[Cy_coeffs, Cy_terms] = coeffs(Cy, [x y z]);
disp([Cy_coeffs(:), Cy_terms(:)])

Cz = simplify(diff(C, z));
[Cz_coeffs, Cz_terms] = coeffs(Cz, [x y z]);
disp([Cz_coeffs(:), Cz_terms(:)])
