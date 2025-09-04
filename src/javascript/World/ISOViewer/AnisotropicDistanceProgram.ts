import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'


class AnisotropicDistancePass implements GPGPUProgram 
{
    variableNames = ['Input']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        inputVariable: 'occupancy' | 'distance',
        inputDirection: '-x' | '+x' | '-y' | '+y' | '-z' | '+z' ,     
        inputDistance: number,
    ) 
    {
        const [inSign, inAxis] = inputDirection
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `
        const ivec3 maxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});
        const int maxDistance = min(${inputDistance}, maxCoords.${inAxis}); 

        ${inputVariable == 'occupancy' ? `
        int getDistance(ivec3 coords) { return bool(getInput(coords.z, coords.y, coords.x, 0)) ? 0 : ${inputDistance}; }` : `
        int getDistance(ivec3 coords) { return  int(getInput(coords.z, coords.y, coords.x, 0)); }`}

        ${inSign == '-' ? `
        bool inBounds(int coord) { return coord >= 0; }` : `
        bool inBounds(int coord) { return coord <= maxCoords.${inAxis}; }`}

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;

            int blockDistance = getDistance(blockCoords);
            if (blockDistance == 0) 
            {
                setOutput(0.0);
                return;
            }

            ivec3 neighborCoords = blockCoords;
            int neighborDistance;

            for (int distance = 1; distance <= maxDistance; distance++) 
            {
                neighborCoords.${inAxis} = blockCoords.${inAxis} ${inSign} distance;
                if (inBounds(neighborCoords.${inAxis})) 
                {
                    neighborDistance = max(getDistance(neighborCoords), distance);
                    blockDistance = min(blockDistance, neighborDistance);
                    if (distance >= blockDistance) break;
                }
            }

            setOutput(float(blockDistance));
        }
        `
    }
}

function runGpgpuProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor4D
}

export function anisotropicDistanceProgram(inputOccupancy: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    const getDistanceDyadX0 = new AnisotropicDistancePass(shape, 'occupancy', '-x', maxDistance)
    const getDistanceDyadX1 = new AnisotropicDistancePass(shape, 'occupancy', '+x', maxDistance)
    const getDistanceDyadY0 = new AnisotropicDistancePass(shape, 'distance',  '-y', maxDistance)
    const getDistanceDyadY1 = new AnisotropicDistancePass(shape, 'distance',  '+y', maxDistance)
    const getDistanceDyadZ0 = new AnisotropicDistancePass(shape, 'distance',  '-z', maxDistance)
    const getDistanceDyadZ1 = new AnisotropicDistancePass(shape, 'distance',  '+z', maxDistance)

    // X passes
    const distanceDyadX0 = runGpgpuProgram(getDistanceDyadX0, [inputOccupancy])
    const distanceDyadX1 = runGpgpuProgram(getDistanceDyadX1, [inputOccupancy])

    // Y passes
    const distanceQuadrantXY00 = runGpgpuProgram(getDistanceDyadY0, [distanceDyadX0]);
    const distanceQuadrantXY01 = runGpgpuProgram(getDistanceDyadY1, [distanceDyadX0]); tf.dispose(distanceDyadX0)
    const distanceQuadrantXY10 = runGpgpuProgram(getDistanceDyadY0, [distanceDyadX1]);
    const distanceQuadrantXY11 = runGpgpuProgram(getDistanceDyadY1, [distanceDyadX1]); tf.dispose(distanceDyadX1)

    // Z passes
    const distanceOctantXYZ000 = runGpgpuProgram(getDistanceDyadZ0, [distanceQuadrantXY00]);
    const distanceOctantXYZ001 = runGpgpuProgram(getDistanceDyadZ1, [distanceQuadrantXY00]); tf.dispose(distanceQuadrantXY00)
    const distanceOctantXYZ010 = runGpgpuProgram(getDistanceDyadZ0, [distanceQuadrantXY01]);
    const distanceOctantXYZ011 = runGpgpuProgram(getDistanceDyadZ1, [distanceQuadrantXY01]); tf.dispose(distanceQuadrantXY01)
    const distanceOctantXYZ100 = runGpgpuProgram(getDistanceDyadZ0, [distanceQuadrantXY10]);
    const distanceOctantXYZ101 = runGpgpuProgram(getDistanceDyadZ1, [distanceQuadrantXY10]); tf.dispose(distanceQuadrantXY10)
    const distanceOctantXYZ110 = runGpgpuProgram(getDistanceDyadZ0, [distanceQuadrantXY11]);
    const distanceOctantXYZ111 = runGpgpuProgram(getDistanceDyadZ1, [distanceQuadrantXY11]); tf.dispose(distanceQuadrantXY11)
    
    // Concatenate directional distance maps in binary order
    const distanceOctants = tf.concat([
        distanceOctantXYZ000,
        distanceOctantXYZ100,
        distanceOctantXYZ010,
        distanceOctantXYZ110,
        distanceOctantXYZ001,
        distanceOctantXYZ101,
        distanceOctantXYZ011,
        distanceOctantXYZ111,
    ], 0)

    tf.dispose([
        distanceOctantXYZ000,
        distanceOctantXYZ100,
        distanceOctantXYZ010,
        distanceOctantXYZ110,
        distanceOctantXYZ001,
        distanceOctantXYZ101,
        distanceOctantXYZ011,
        distanceOctantXYZ111,
    ])

    return distanceOctants
}