#ifndef STRUCT_CAMERA
#define STRUCT_CAMERA

struct Camera 
{
    vec3  position;       // position in model coordinates 
    vec3  uvw;            // position in texture coordinates 
    vec3  direction;      // normalized direction in model coordinates 
};

Camera set_camera()
{
    Camera camera;
    camera.position      = v_camera_position;
    camera.uvw           = v_camera_position * u_intensity_map.inv_size;
    camera.direction     = normalize(v_camera_direction);
    return camera;
}

#endif // STRUCT_CAMERA
