
trace.prev_residue = trace.residue;

trace.residue = sample_volume_tricubic(trace.position) - u_rendering.isovalue;

trace.intersected = sign_change(trace.residue, trace.prev_residue);
