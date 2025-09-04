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
        bool outBounds(int coord) { return coord < 0; }` : `
        bool outBounds(int coord) { return coord > maxCoords.${inAxis}; }`}

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;
            ivec3 neighborCoords = blockCoords;

            int blockDistance = getDistance(blockCoords);
            if (blockDistance == 0) 
            {
                setOutput(0.0);
                return;
            }

            int neighborDistance;

            for (int distance = 1; distance <= maxDistance; distance++) 
            {
                neighborCoords.${inAxis} = blockCoords.${inAxis} ${inSign} distance;
                if (outBounds(neighborCoords.${inAxis})) break;

                neighborDistance = max(getDistance(neighborCoords), distance);
                blockDistance = min(blockDistance, neighborDistance);
                if (distance >= blockDistance) break;
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

    const getDistanceOrthantX0 = new AnisotropicDistancePass(shape, 'occupancy', '-x', maxDistance)
    const getDistanceOrthantX1 = new AnisotropicDistancePass(shape, 'occupancy', '+x', maxDistance)
    const getDistanceOrthantY0 = new AnisotropicDistancePass(shape, 'distance',  '-y', maxDistance)
    const getDistanceOrthantY1 = new AnisotropicDistancePass(shape, 'distance',  '+y', maxDistance)
    const getDistanceOrthantZ0 = new AnisotropicDistancePass(shape, 'distance',  '-z', maxDistance)
    const getDistanceOrthantZ1 = new AnisotropicDistancePass(shape, 'distance',  '+z', maxDistance)

    // X passes
    const distanceOrthantX0 = runGpgpuProgram(getDistanceOrthantX0, [inputOccupancy])
    const distanceOrthantX1 = runGpgpuProgram(getDistanceOrthantX1, [inputOccupancy])

    // Y passes
    const distanceQuadrantXY00 = runGpgpuProgram(getDistanceOrthantY0, [distanceOrthantX0]);
    const distanceQuadrantXY01 = runGpgpuProgram(getDistanceOrthantY1, [distanceOrthantX0]); tf.dispose(distanceOrthantX0)
    const distanceQuadrantXY10 = runGpgpuProgram(getDistanceOrthantY0, [distanceOrthantX1]);
    const distanceQuadrantXY11 = runGpgpuProgram(getDistanceOrthantY1, [distanceOrthantX1]); tf.dispose(distanceOrthantX1)

    // Z passes
    const distanceOctantXYZ000 = runGpgpuProgram(getDistanceOrthantZ0, [distanceQuadrantXY00]);
    const distanceOctantXYZ001 = runGpgpuProgram(getDistanceOrthantZ1, [distanceQuadrantXY00]); tf.dispose(distanceQuadrantXY00)
    const distanceOctantXYZ010 = runGpgpuProgram(getDistanceOrthantZ0, [distanceQuadrantXY01]);
    const distanceOctantXYZ011 = runGpgpuProgram(getDistanceOrthantZ1, [distanceQuadrantXY01]); tf.dispose(distanceQuadrantXY01)
    const distanceOctantXYZ100 = runGpgpuProgram(getDistanceOrthantZ0, [distanceQuadrantXY10]);
    const distanceOctantXYZ101 = runGpgpuProgram(getDistanceOrthantZ1, [distanceQuadrantXY10]); tf.dispose(distanceQuadrantXY10)
    const distanceOctantXYZ110 = runGpgpuProgram(getDistanceOrthantZ0, [distanceQuadrantXY11]);
    const distanceOctantXYZ111 = runGpgpuProgram(getDistanceOrthantZ1, [distanceQuadrantXY11]); tf.dispose(distanceQuadrantXY11)
    
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