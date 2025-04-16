
out vec3 v_position;
out vec3 v_camera_position;
out vec3 v_camera_direction;
out vec3 v_ray_direction;
out mat4 v_clip_space_matrix;

#include "./chunks/uniforms/uniforms"

void main() {				    

    // camera position in model coordinates
    vec4 camera_position = inverse(modelMatrix) * vec4(cameraPosition, 1.0);   
    vec4 camera_direction = inverse(modelViewMatrix) * vec4(vec3(0.0, 0.0, -1.0), 0.0);

    // vertex position varying
    v_position = position * u_intensity_map.inv_spacing; // vertex position in grid coordinates

    // Camera varying
    v_camera_position = camera_position.xyz * u_intensity_map.inv_spacing; // camera position in grid coordinates
    v_camera_direction = camera_direction.xyz * u_intensity_map.inv_spacing; // camera direction in grid coordinates

    // Ray varying
    v_ray_direction = position - v_camera_position; // direction vector from camera to vertex in grid coordinates

    // Matrix varying
    v_clip_space_matrix = projectionMatrix * modelViewMatrix;

    // Vertex position in physical space
    gl_Position = v_clip_space_matrix * vec4(position, 1.0);
}