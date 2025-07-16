
poly.residuals[3] = sample_trilaplacian_intensity(cell.exit_position, poly.fxx_fyy_fzz_f[3]);
poly.residuals[3] -= u_rendering.intensity;
