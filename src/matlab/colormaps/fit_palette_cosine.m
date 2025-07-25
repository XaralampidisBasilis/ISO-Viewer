function params = fit_palette_cosine(type)

    close all;  % Close all figures before running

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

    % Residual returns an N×3 matrix reshaped to vector
    f = @(p) reshape( ...
        (p(1:3)' + (p(4:6)' .* cos(2*pi*(t * p(7:9)' + p(10:12)'))) ) ...
        - cmap, [], 1);

    % initial guess
    p0 = [mean(cmap)'; 0.5*ones(3,1); ones(3,1); zeros(3,1)];
    p0 = p0(:);

    lb = [-1*ones(12,1)]; ub = [2*ones(12,1)];
    opts = optimoptions('lsqnonlin','Display','final','MaxFunEvals',1e4,'MaxIter',500);

    p_fit = lsqnonlin(f, p0, lb, ub, opts);

    params.a = p_fit(1:3);
    params.b = p_fit(4:6);
    params.c = p_fit(7:9);
    params.d = p_fit(10:12);

    fprintf('vec3 %s(float t) \n', type);
    fprintf('{\n');
    fprintf('    vec3 a = vec3(%.6f, %.6f, %.6f);\n', params.a);
    fprintf('    vec3 b = vec3(%.6f, %.6f, %.6f);\n', params.b);
    fprintf('    vec3 c = vec3(%.6f, %.6f, %.6f);\n', params.c);
    fprintf('    vec3 d = vec3(%.6f, %.6f, %.6f);\n', params.d);
    fprintf('    return palette(t, a, b, c, d);\n');
    fprintf('}\n');
    
    fitted = params.a' + params.b' .* cos(2*pi*(t * params.c' + params.d'));
    figure;
    subplot(2,1,1);
    plot(t, cmap, 'LineWidth',1.5), title(['Original colormap: ', type]);
    legend('R','G','B'); ylim([0 1]);
    subplot(2,1,2);
    plot(t, fitted, '--', 'LineWidth',1.5), title('Fitted cosine palette');
    legend('R','G','B'); ylim([0 1]);
    
    % Compute fitted and error maps
    cmap_fit = params.a' + params.b' .* cos(2*pi*(t * params.c' + params.d'));
    err = vecnorm(cmap - cmap_fit, 2, 2);
    err = err / max(err);
    cmap_err = [err err err];

    % Display all three maps horizontally
    figure('Name', ['Cosine Fit for "', type, '" Colormap'], 'Color', 'w');
    
    subplot(1,3,1);
    image(permute(cmap, [1 3 2]));
    axis off; title(['Original: ', type]);

    subplot(1,3,2);
    image(permute(cmap_fit, [1 3 2]));
    axis off; title('Fitted');

    subplot(1,3,3);
    image(permute(cmap_err, [1 3 2]));
    axis off; title('Error (grayscale)');
end