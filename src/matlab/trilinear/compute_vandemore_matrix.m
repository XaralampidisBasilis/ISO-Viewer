
clc, clear

% inv(fliplr(vander([0.0, 0.5, 1.0])))'

% Step 1: Create the symbolic Vandermonde inverse (transposed)
x = sym([0, 1, 2, 3, 4, 5]) / 5;
V = fliplr(vander(x));
IV = inv(V).';  % symbolic matrix with exact fractions

% Step 2: Extract numerators and denominators element-wise
[N, D] = numden(IV);

% Step 3: Compute the least common multiple of all denominators
d = D(:);  % flatten
cd = d(1);
for k = 2:length(d)
    cd = lcm(cd, d(k));
end

% Step 4: Scale the matrix so that all entries are integers
R = cd ./ D;
NR = N .* R;

% Step 5: Break the inv Vandermonde matrix
NR00 = NR(1:3, 1:3);
NR01 = NR(1:3, 4:6);
NR10 = NR(4:6, 1:3);
NR11 = NR(4:6, 4:6);
disp([NR00, NR01; NR10, NR11])

% Step 5: show equality
disp(IV - NR ./ cd)