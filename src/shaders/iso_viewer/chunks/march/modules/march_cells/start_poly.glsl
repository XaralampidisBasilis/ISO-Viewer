
poly.f0_f1_f2_f3[3] = sample_trilaplacian_intensity(cell.exit_position, poly.fxx_fyy_fzz_f[3], poly.gxx_gyy_gzz_g[2]);

// vec4 fxx_fyy_fzz_f = vec4(0.0);
// vec3 gxx_gyy_gzz = vec3(0.0);
// poly.f0_f1_f2_f3[3] = sample_trilaplacian_intensity(cell.exit_position, fxx_fyy_fzz_f, gxx_gyy_gzz);
// poly.fxx_fyy_fzz_f[0][3] = fxx_fyy_fzz_f[0];
// poly.fxx_fyy_fzz_f[1][3] = fxx_fyy_fzz_f[1];
// poly.fxx_fyy_fzz_f[2][3] = fxx_fyy_fzz_f[2];
// poly.fxx_fyy_fzz_f[3][3] = fxx_fyy_fzz_f[3];