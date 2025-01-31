clc, clear

% Define symbolic variables
syms f00 f10 f01 f11 
syms ax ay bx by 
syms x y t
assume([f00 f10 f01 f11], 'real');
assume([ax ay bx by], 'real');
assume([x y t], 'real');
    
% Define the trilinear coefficients
c00 = (1 - x) * (1 - y) * f00;
c10 = (0 + x) * (1 - y) * f10;
c01 = (1 - x) * (0 + y) * f01;
c11 = (0 + x) * (0 + y) * f11;

% Combine all coefficients
f_xy = c00 + c10 + c01 + c11;

% Substitute variables of a line
rx_t = ax + (bx - ax) * t;
ry_t = ay + (by - ay) * t;
f_t = simplify(subs(f_xy, [x, y], [rx_t, ry_t]));
   
%% Define symbolic variables
syms f0 f1 f2
syms c0 c1 c2
syms t0 t1 t2
assume([f0 f1 f2], 'real');
assume([c0 c1 c2], 'real');
assume([t0 t1 t2], 'real');

f = [f0 f1 f2]';

vand = fliplr(vander(t));
inv_vand = inv(vand);

c = inv_vand * f;
c2 = simplify(subs(c(2), [t0 t2], [0 1]));

f_t1 = subs(f_t, t, t1);
c2 = simplify(subs(c2, f1, f_t1));