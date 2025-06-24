
poly.f0_f1_f2_f3[3] = sample_trilaplacian_intensity(cell.exit_position, poly.fxx_fyy_fzz_f[3]);
poly.f0_f1_f2_f3[3] -= u_rendering.intensity;
poly.fxx_fyy_fzz_f[3][3] -= u_rendering.intensity;