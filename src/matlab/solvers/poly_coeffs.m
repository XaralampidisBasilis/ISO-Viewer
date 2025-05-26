% Define the roots
roots = [1.00001, 0.99999, 1];

% Display the polynomial coefficients
disp('Polynomial coefficients (ascending powers):');
%disp(flip(poly(roots)));
        
syms x
expr = expand((x - 1)*(x - 1.00001)*(x - 2)*(x - 2.00001));                % Expand symbolic expression
coeffs_desc = coeffs(expr, x, 'All'); % Get all coefficients in descending order
coeffs_asc = double(fliplr(coeffs_desc)); % Convert to numeric, ascending order
disp(coeffs_asc)