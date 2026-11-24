#ifndef SNAP_TRACE_DISTANCE
#define SNAP_TRACE_DISTANCE

float snapTraceDistanceFloor(float distance, float spacing, float phase)
{
    return spacing * (floor(distance / spacing - phase) + phase);
}

float snapTraceDistanceCeil(float distance, float spacing, float phase)
{
    return spacing * (ceil(distance / spacing - phase) + phase);
}

#endif
