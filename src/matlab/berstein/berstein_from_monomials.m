clc, clear
%MONOMIALTOBERNSTEINMATRIX Constructs the (n+1)x(n+1) transformation matrix
% that converts monomial basis coefficients to Bernstein basis coefficients
% for polynomials of degree n over the interval [0,1].
%
% INPUT:
%   n - Degree of the polynomial (e.g., 5 for quintic)
%
% OUTPUT:
%   M - (n+1)x(n+1) matrix such that:
%         b = M * a
%       where:
%         a = column vector of monomial coefficients [a0; a1; ...; an]
%         b = column vector of Bernstein coefficients [b0; b1; ...; bn]
%
% Each row of M contains the coefficients of the i-th Bernstein basis
% polynomial B_v^n(t) expressed in the monomial basis:
%     B_v^n(t) = sum_k M(v+1, l+1) * t^l

n = 5;
M = zeros(n+1);  % Preallocate (n+1)x(n+1)

for v = 0:n
    for l = v:n
        M(v+1, l+1) = nchoosek(n, l) * nchoosek(l, v) * (-1)^(l - v);
    end
end

% transpose to follow glsl format
M = M.';
disp(M)

% Break the bernstein matrix
%M00 = M(1:3, 1:3);
%M01 = M(1:3, 4:6);
%M10 = M(4:6, 1:3);
%M11 = M(4:6, 4:6);
%disp([M00, M01; M10, M11])

