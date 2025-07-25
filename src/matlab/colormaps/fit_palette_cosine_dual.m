function params = fit_palette_cosine_dual(type)
    close all;
    N = 256;
    t = linspace(0,1,N)';
    
    addpath('customcolormap'); 
    addpath('slan'); 
    try
        cmap = feval(type, N);
    catch
    try
        cmap = customcolormap_preset(type);
    catch
     try
        cmap = slanCM(type, N);
    catch
        error('Colormap "%s" is not recognized by MATLAB or customcolormap_preset.', type);
    end
    end
    end

    % Residual function for 2-cosine GLSL palette
    f = @(p) reshape( ...
        p(1:3)' + ...
        p(4:6)'  .* cos(2*pi*(t * p(7:9)'  + p(10:12)')) + ...
        p(13:15)'.* cos(2*pi*(t * p(16:18)' + p(19:21)')) ...
        - cmap, [], 1);

    % Initial guess
    p0 = [mean(cmap)'; ...
          0.5*ones(3,1); 1*ones(3,1); zeros(3,1); ...
          0.25*ones(3,1); 2*ones(3,1); zeros(3,1)];
    p0 = p0(:);

    % Bounds
    lb = -2 * ones(21,1);
    ub =  2 * ones(21,1);
    opts = optimoptions('lsqnonlin','Display','final','MaxFunEvals',2e4,'MaxIter',1e3);
    p_fit = lsqnonlin(f, p0, lb, ub, opts);

    % Extract parameters
    params.a  = p_fit(1:3);
    params.b1 = p_fit(4:6);
    params.c1 = p_fit(7:9);
    params.d1 = p_fit(10:12);
    params.b2 = p_fit(13:15);
    params.c2 = p_fit(16:18);
    params.d2 = p_fit(19:21);

    % GLSL-style output
    fprintf('vec3 %s(float t) \n', type);
    fprintf('{\n');
    fprintf('    vec3 a  = vec3(%.6f, %.6f, %.6f);\n', params.a);
    fprintf('    vec3 b1 = vec3(%.6f, %.6f, %.6f);\n', params.b1);
    fprintf('    vec3 c1 = vec3(%.6f, %.6f, %.6f);\n', params.c1);
    fprintf('    vec3 d1 = vec3(%.6f, %.6f, %.6f);\n', params.d1);
    fprintf('    vec3 b2 = vec3(%.6f, %.6f, %.6f);\n', params.b2);
    fprintf('    vec3 c2 = vec3(%.6f, %.6f, %.6f);\n', params.c2);
    fprintf('    vec3 d2 = vec3(%.6f, %.6f, %.6f);\n', params.d2);
    fprintf('    return palette(t, a, b1, c1, d1, b2, c2, d2);\n');
    fprintf('}\n');
    
    % Evaluate
    cmap_fit = params.a' + ...
        params.b1' .* cos(2*pi*(t * params.c1' + params.d1')) + ...
        params.b2' .* cos(2*pi*(t * params.c2' + params.d2'));

    % Error map
    err = vecnorm(cmap - cmap_fit, 2, 2); err = err / max(err);
    cmap_err = [err err err];

    % Display horizontal bars
    figure('Name', ['Fit: ', type], 'Color', 'w');
    subplot(1,3,1); image(permute(cmap, [1 3 2]));     axis off; title('Original');
    subplot(1,3,2); image(permute(cmap_fit, [1 3 2])); axis off; title('Fitted');
    subplot(1,3,3); image(permute(cmap_err, [1 3 2])); axis off; title('Error');

    % Channel-wise curve comparison
    figure('Name', ['Channels: ', type], 'Color', 'w');
    subplot(2,1,1); plot(t, cmap, 'LineWidth',1.5); title(['Original RGB: ', type]);
    legend('R','G','B'); ylim([0 1]);
    subplot(2,1,2); plot(t, cmap_fit, '--', 'LineWidth',1.5); title('Fitted RGB (2 cosines)');
    legend('R','G','B'); ylim([0 1]);
end
