clc, clear
syms x y z
assume([x y z], 'real')

syms xmin xmax ymin ymax zmin zmax
assume([xmin xmax ymin ymax zmin zmax], 'real')

syms u v w
assume([u v w], 'real')
assume(0 <= u & u <= 1)
assume(0 <= v & v <= 1)
assume(0 <= w & w <= 1)

syms f000 f100 f010 f001 f011 f101 f110 f111 fxx fyy fzz
assume([f000 f100 f010 f001 f011 f101 f110 f111, fxx fyy fzz], 'real')
assume(0 <= f000 & f000 <= 1)
assume(0 <= f100 & f100 <= 1)
assume(0 <= f010 & f010 <= 1)
assume(0 <= f001 & f001 <= 1)
assume(0 <= f001 & f001 <= 1)
assume(0 <= f110 & f110 <= 1)
assume(0 <= f101 & f101 <= 1)
assume(0 <= f011 & f011 <= 1)
assume(0 <= f111 & f111 <= 1)

% Define the trilinear coefficients
c000 = (1 - u) * (1 - v) * (1 - w) * f000;
c100 = (0 + u) * (1 - v) * (1 - w) * f100;
c010 = (1 - u) * (0 + v) * (1 - w) * f010;
c001 = (1 - u) * (1 - v) * (0 + w) * f001;
c011 = (1 - u) * (0 + v) * (0 + w) * f011;
c101 = (0 + u) * (1 - v) * (0 + w) * f101;
c110 = (0 + u) * (0 + v) * (1 - w) * f110;
c111 = (0 + u) * (0 + v) * (0 + w) * f111;

cxx  = u * (u - 1) * fxx;
cyy  = v * (v - 1) * fyy;
czz  = w * (w - 1) * fzz;

% Combine all coefficients
c = simplify(c000 + c100 + c010 + c001 + c011 + c101 + c110 + c111);

% Compute gradient with chain rule
gx = simplify(diff(c, u) * diff((x - xmin) / (xmax - xmin), x));
gy = simplify(diff(c, v) * diff((y - ymin) / (ymax - ymin), y));
gz = simplify(diff(c, w) * diff((z - zmin) / (zmax - zmin), z));

% Combine gradient components
g = [gx; gy; gz];

%% Efficient compute of gradient 3 samples

% compute projections
Cx0 = simplify(subs(c, u, 0));
Cy0 = simplify(subs(c, v, 0));
Cz0 = simplify(subs(c, w, 0));

% compute differences
Gx = (c - Cx0) / (x - xmin);
Gy = (c - Cy0) / (y - ymin);
Gz = (c - Cz0) / (z - zmin);

% compute differences
% Gx = (c - Cx0) / (u * (xmax - xmin));
% Gy = (c - Cy0) / (u * (ymax - ymin));
% Gz = (c - Cz0) / (u * (zmax - zmin));

% compute efficient gradient
G1 = simplify([Gx; Gy; Gz]);

% compute error
disp(simplify(g - G1));

%% Efficient compute of gradient 3 samples

% compute projections
Cx1 = simplify(subs(c, u, 1));
Cy1 = simplify(subs(c, v, 1));
Cz1 = simplify(subs(c, w, 1));

% compute differences
Gx = (Cx1 - c) / (xmax - x);
Gy = (Cy1 - c) / (ymax - y);
Gz = (Cz1 - c) / (zmax - z);

% compute differences
% Gx = (Cx1 - c) / ((1 - u) * (xmax - xmin));
% Gy = (Cy1 - c) / ((1 - u) * (ymax - ymin));
% Gz = (Cz1 - c) / ((1 - u) * (zmax - zmin));

% compute efficient gradient
G2 = simplify([Gx; Gy; Gz]);

% compute error
disp(simplify(g - G2));


%% Efficient compute of gradient for singular cases 6 samples

% compute projections 0
Cx0 = simplify(subs(c, u, 0));
Cy0 = simplify(subs(c, v, 0));
Cz0 = simplify(subs(c, w, 0));

% compute projections 1
Cx1 = simplify(subs(c, u, 1));
Cy1 = simplify(subs(c, v, 1));
Cz1 = simplify(subs(c, w, 1));

% compute differences
Gx = (Cx1 - Cx0) / (xmax - xmin);
Gy = (Cy1 - Cy0) / (ymax - ymin);
Gz = (Cz1 - Cz0) / (zmax - zmin);

% compute efficient gradient
G3 = simplify([Gx; Gy; Gz]);

% compute error
disp(simplify(g - G3));
