
float residue = sample_volume_tricubic(trace.position) - u_rendering.isovalue;

trace.intersected = sign_change(trace.residue, residue);

trace.residue = residue;