
out vec3 v_position;
out vec3 v_camera_position;
out vec3 v_ray_direction;

#include "./chunks/uniforms/uniforms_intensity_map"

void main() 
{				    
    // vertex position varying
    v_position = position * vec3(u_intensity_map.dimensions); // vertex position in grid coordinates

    // Camera varying
    vec4 camera_position = inverse(modelMatrix) * vec4(cameraPosition, 1.0);   
    v_camera_position = camera_position.xyz * vec3(u_intensity_map.dimensions); // camera position in grid coordinates

    // Ray varying
    v_ray_direction = v_position - v_camera_position; // direction vector from camera to vertex in grid coordinates

    // Vertex position in physical space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}