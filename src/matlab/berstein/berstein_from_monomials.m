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

n = 2;
M = zeros(n+1);  % Preallocate (n+1)x(n+1)

for v = 0:n
    for l = v:n
        M(v+1, l+1) = nchoosek(n, l) * nchoosek(l, v) * (-1)^(l - v);
    end
end

M = sym(M);
IM = inv(M);
%disp(IM);

% Create the symbolic Vandermonde inverse 
%x = sym(linspace(0, 1, n+1));
%x = sym([0, 2/5, 3/5, 1]);
x = sym([1/3, 2/3, 1]);

V = fliplr(vander(x));
IV = inv(V);  % symbolic matrix with exact fractions
%disp(IV)

% samples to bernstein
A = IM' * IV;
disp(A)

C = zeros(3, 4); % 3 rows (i = 0 to 2), 4 columns (j = 0 to 3)

for i = 0:2
    for j = 0:3
        k = i + j; % total degree
        numerator = nchoosek(2, i) * nchoosek(3, j);
        denominator = nchoosek(5, k);
        C(i+1, j+1) = numerator / denominator;
    end
end

disp('Coefficient matrix C (each entry = B_i^2 * B_j^3 as Bernstein^5):');
disp(C);