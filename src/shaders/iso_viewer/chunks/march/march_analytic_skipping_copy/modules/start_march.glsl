
#define MAX_BATCH_COUNT 50
#define MAX_BLOCK_SUB_COUNT 20
#define MAX_CELL_SUB_COUNT 10

trace.distance = ray.start_distance;
trace.position = camera.position + ray.direction * trace.distance;