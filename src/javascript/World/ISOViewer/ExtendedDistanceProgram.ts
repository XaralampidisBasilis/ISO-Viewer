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

class ExtendedDistancePass implements GPGPUProgram 
{
    variableNames = ['Distance']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        inputDirection: '-x' | '+x' | '-y' | '+y' | '-z' | '+z',     
        inputDistance: number
    ) 
    {
        const [inSign, inAxis] = inputDirection
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]

        this.userCode = `
        const ivec3 maxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});
        const int maxDistance = min(${inputDistance}, maxCoords.${inAxis}); 
        
        ${inSign == '-' ? `
        bool outBounds(int coord) { return coord < 0; }` : `
        bool outBounds(int coord) { return coord > maxCoords.${inAxis}; }`}
        int getDistance(ivec3 coords) { return  int(getDistance(coords.z, coords.y, coords.x, 0)); }

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
            blockDistance = maxDistance;

            for (int distance = 1; distance <= maxDistance; distance++) 
            {
                neighborCoords.${inAxis} = blockCoords.${inAxis} ${inSign} distance;
                if (outBounds(neighborCoords.${inAxis})) break;

                neighborDistance = getDistance(neighborCoords);
                if (distance >= neighborDistance)
                {
                    blockDistance = distance;
                    break;
                }
            }

            setOutput(float(blockDistance));
        }
        `
    }
}
class ExtendedDistanceBitpack implements GPGPUProgram 
{
    variableNames = ['DistanceX', 'DistanceY', 'DistanceZ', 'Occupancy']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number]) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `
        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances;

            blockDistances.x = int(getDistanceX(blockCoords.z, blockCoords.y, blockCoords.x, 0));
            blockDistances.y = int(getDistanceY(blockCoords.z, blockCoords.y, blockCoords.x, 0));
            blockDistances.z = int(getDistanceZ(blockCoords.z, blockCoords.y, blockCoords.x, 0));
            blockDistances.a = int(getOccupancy(blockCoords.z, blockCoords.y, blockCoords.x, 0));

            int packedDistances = 
                clamp(blockDistances.r, 0, 31) * 2048 + 
                clamp(blockDistances.g, 0, 31) * 64 + 
                clamp(blockDistances.b, 0, 31) * 2 + 
                clamp(blockDistances.a, 0,  1) * 1;

            setOutput(float(packedDistances));
        }
        `
    }
}

function runGpgpuProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    return tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(prog, inputs)) as tf.Tensor4D
}

export function extendedDistanceProgram(inputOccupancy: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    // Programs
    const getBitpacked = new ExtendedDistanceBitpack(shape)

    const getDistanceOrthantX0 = new AnisotropicDistancePass(shape, 'occupancy', '-x', maxDistance)
    const getDistanceOrthantX1 = new AnisotropicDistancePass(shape, 'occupancy', '+x', maxDistance)
    const getDistanceOrthantY0 = new AnisotropicDistancePass(shape, 'occupancy', '-y', maxDistance)
    const getDistanceOrthantY1 = new AnisotropicDistancePass(shape, 'occupancy', '+y', maxDistance)
    
    const getDistanceQuadrantWithY0  = new AnisotropicDistancePass(shape, 'distance',  '-y', maxDistance)
    const getDistanceQuadrantWithY1  = new AnisotropicDistancePass(shape, 'distance',  '+y', maxDistance)
    const getDistanceQuadrantWithZ0  = new AnisotropicDistancePass(shape, 'distance',  '-z', maxDistance)
    const getDistanceQuadrantWithZ1  = new AnisotropicDistancePass(shape, 'distance',  '+z', maxDistance)
    
    const getDistanceXOctantWithX0 = new ExtendedDistancePass(shape, '-x', maxDistance)
    const getDistanceXOctantWithX1 = new ExtendedDistancePass(shape, '+x', maxDistance)
    const getDistanceYOctantWithY0 = new ExtendedDistancePass(shape, '-y', maxDistance)
    const getDistanceYOctantWithY1 = new ExtendedDistancePass(shape, '+y', maxDistance)
    const getDistanceZOctantWithZ0 = new ExtendedDistancePass(shape, '-z', maxDistance)
    const getDistanceZOctantWithZ1 = new ExtendedDistancePass(shape, '+z', maxDistance)

    // 1D
    const distanceOrthantX0 = runGpgpuProgram(getDistanceOrthantX0, [inputOccupancy])
    const distanceOrthantX1 = runGpgpuProgram(getDistanceOrthantX1, [inputOccupancy])
    const distanceOrthantY0 = runGpgpuProgram(getDistanceOrthantY0, [inputOccupancy])
    const distanceOrthantY1 = runGpgpuProgram(getDistanceOrthantY1, [inputOccupancy])

    // 2D
    const distanceQuadrantXY00 = runGpgpuProgram(getDistanceQuadrantWithY0, [distanceOrthantX0]);
    const distanceQuadrantXY01 = runGpgpuProgram(getDistanceQuadrantWithY1, [distanceOrthantX0]); 
    const distanceQuadrantXZ00 = runGpgpuProgram(getDistanceQuadrantWithZ0, [distanceOrthantX0]);
    const distanceQuadrantXZ01 = runGpgpuProgram(getDistanceQuadrantWithZ1, [distanceOrthantX0]); tf.dispose(distanceOrthantX0)
    const distanceQuadrantXY10 = runGpgpuProgram(getDistanceQuadrantWithY0, [distanceOrthantX1]);
    const distanceQuadrantXY11 = runGpgpuProgram(getDistanceQuadrantWithY1, [distanceOrthantX1]); 
    const distanceQuadrantXZ10 = runGpgpuProgram(getDistanceQuadrantWithZ0, [distanceOrthantX1]);
    const distanceQuadrantXZ11 = runGpgpuProgram(getDistanceQuadrantWithZ1, [distanceOrthantX1]); tf.dispose(distanceOrthantX1)
    const distanceQuadrantYZ00 = runGpgpuProgram(getDistanceQuadrantWithZ0, [distanceOrthantY0]);
    const distanceQuadrantYZ01 = runGpgpuProgram(getDistanceQuadrantWithZ1, [distanceOrthantY0]); tf.dispose(distanceOrthantY0)
    const distanceQuadrantYZ10 = runGpgpuProgram(getDistanceQuadrantWithZ0, [distanceOrthantY1]);
    const distanceQuadrantYZ11 = runGpgpuProgram(getDistanceQuadrantWithZ1, [distanceOrthantY1]); tf.dispose(distanceOrthantY1)

    // 3D
    const distanceXOctantXYZ000 = runGpgpuProgram(getDistanceXOctantWithX0, [distanceQuadrantYZ00]);
    const distanceXOctantXYZ001 = runGpgpuProgram(getDistanceXOctantWithX1, [distanceQuadrantYZ00]); tf.dispose(distanceQuadrantYZ00)
    const distanceXOctantXYZ010 = runGpgpuProgram(getDistanceXOctantWithX0, [distanceQuadrantYZ01]);
    const distanceXOctantXYZ011 = runGpgpuProgram(getDistanceXOctantWithX1, [distanceQuadrantYZ01]); tf.dispose(distanceQuadrantYZ01)
    const distanceXOctantXYZ100 = runGpgpuProgram(getDistanceXOctantWithX0, [distanceQuadrantYZ10]);
    const distanceXOctantXYZ101 = runGpgpuProgram(getDistanceXOctantWithX1, [distanceQuadrantYZ10]); tf.dispose(distanceQuadrantYZ10)
    const distanceXOctantXYZ110 = runGpgpuProgram(getDistanceXOctantWithX0, [distanceQuadrantYZ11]);
    const distanceXOctantXYZ111 = runGpgpuProgram(getDistanceXOctantWithX1, [distanceQuadrantYZ11]); tf.dispose(distanceQuadrantYZ11)
    const distanceYOctantXYZ000 = runGpgpuProgram(getDistanceYOctantWithY0, [distanceQuadrantXZ00]);
    const distanceYOctantXYZ001 = runGpgpuProgram(getDistanceYOctantWithY1, [distanceQuadrantXZ00]); tf.dispose(distanceQuadrantXZ00)
    const distanceYOctantXYZ010 = runGpgpuProgram(getDistanceYOctantWithY0, [distanceQuadrantXZ01]);
    const distanceYOctantXYZ011 = runGpgpuProgram(getDistanceYOctantWithY1, [distanceQuadrantXZ01]); tf.dispose(distanceQuadrantXZ01)
    const distanceYOctantXYZ100 = runGpgpuProgram(getDistanceYOctantWithY0, [distanceQuadrantXZ10]);
    const distanceYOctantXYZ101 = runGpgpuProgram(getDistanceYOctantWithY1, [distanceQuadrantXZ10]); tf.dispose(distanceQuadrantXZ10)
    const distanceYOctantXYZ110 = runGpgpuProgram(getDistanceYOctantWithY0, [distanceQuadrantXZ11]);
    const distanceYOctantXYZ111 = runGpgpuProgram(getDistanceYOctantWithY1, [distanceQuadrantXZ11]); tf.dispose(distanceQuadrantXZ11)
    const distanceZOctantXYZ000 = runGpgpuProgram(getDistanceZOctantWithZ0, [distanceQuadrantXY00]);
    const distanceZOctantXYZ001 = runGpgpuProgram(getDistanceZOctantWithZ1, [distanceQuadrantXY00]); tf.dispose(distanceQuadrantXY00)
    const distanceZOctantXYZ010 = runGpgpuProgram(getDistanceZOctantWithZ0, [distanceQuadrantXY01]);
    const distanceZOctantXYZ011 = runGpgpuProgram(getDistanceZOctantWithZ1, [distanceQuadrantXY01]); tf.dispose(distanceQuadrantXY01)
    const distanceZOctantXYZ100 = runGpgpuProgram(getDistanceZOctantWithZ0, [distanceQuadrantXY10]);
    const distanceZOctantXYZ101 = runGpgpuProgram(getDistanceZOctantWithZ1, [distanceQuadrantXY10]); tf.dispose(distanceQuadrantXY10)
    const distanceZOctantXYZ110 = runGpgpuProgram(getDistanceZOctantWithZ0, [distanceQuadrantXY11]);
    const distanceZOctantXYZ111 = runGpgpuProgram(getDistanceZOctantWithZ1, [distanceQuadrantXY11]); tf.dispose(distanceQuadrantXY11)

    // Packing
    const distancesOctantXYZ000 = runGpgpuProgram(getBitpacked, [distanceXOctantXYZ000, distanceYOctantXYZ000, distanceZOctantXYZ000, inputOccupancy]);  tf.dispose([distanceXOctantXYZ000, distanceYOctantXYZ000, distanceZOctantXYZ000])
    const distancesOctantXYZ001 = runGpgpuProgram(getBitpacked, [distanceXOctantXYZ001, distanceYOctantXYZ001, distanceZOctantXYZ001, inputOccupancy]);  tf.dispose([distanceXOctantXYZ001, distanceYOctantXYZ001, distanceZOctantXYZ001])
    const distancesOctantXYZ010 = runGpgpuProgram(getBitpacked, [distanceXOctantXYZ010, distanceYOctantXYZ010, distanceZOctantXYZ010, inputOccupancy]);  tf.dispose([distanceXOctantXYZ010, distanceYOctantXYZ010, distanceZOctantXYZ010])
    const distancesOctantXYZ011 = runGpgpuProgram(getBitpacked, [distanceXOctantXYZ011, distanceYOctantXYZ011, distanceZOctantXYZ011, inputOccupancy]);  tf.dispose([distanceXOctantXYZ011, distanceYOctantXYZ011, distanceZOctantXYZ011])
    const distancesOctantXYZ100 = runGpgpuProgram(getBitpacked, [distanceXOctantXYZ100, distanceYOctantXYZ100, distanceZOctantXYZ100, inputOccupancy]);  tf.dispose([distanceXOctantXYZ100, distanceYOctantXYZ100, distanceZOctantXYZ100])
    const distancesOctantXYZ101 = runGpgpuProgram(getBitpacked, [distanceXOctantXYZ101, distanceYOctantXYZ101, distanceZOctantXYZ101, inputOccupancy]);  tf.dispose([distanceXOctantXYZ101, distanceYOctantXYZ101, distanceZOctantXYZ101])
    const distancesOctantXYZ110 = runGpgpuProgram(getBitpacked, [distanceXOctantXYZ110, distanceYOctantXYZ110, distanceZOctantXYZ110, inputOccupancy]);  tf.dispose([distanceXOctantXYZ110, distanceYOctantXYZ110, distanceZOctantXYZ110])
    const distancesOctantXYZ111 = runGpgpuProgram(getBitpacked, [distanceXOctantXYZ111, distanceYOctantXYZ111, distanceZOctantXYZ111, inputOccupancy]);  tf.dispose([distanceXOctantXYZ111, distanceYOctantXYZ111, distanceZOctantXYZ111])

    // Concatenate 
    const distancesOctants = tf.concat([
        distancesOctantXYZ100, //distancesOctantXYZ000,
        distancesOctantXYZ100, //distancesOctantXYZ100,
        distancesOctantXYZ100, //distancesOctantXYZ010,
        distancesOctantXYZ100, //distancesOctantXYZ110,
        distancesOctantXYZ100, //distancesOctantXYZ001,
        distancesOctantXYZ100, //distancesOctantXYZ101,
        distancesOctantXYZ100, //distancesOctantXYZ011,
        distancesOctantXYZ100, //distancesOctantXYZ111,
    ], 0)

    tf.dispose([
        distancesOctantXYZ000,
        distancesOctantXYZ100,
        distancesOctantXYZ010,
        distancesOctantXYZ110,
        distancesOctantXYZ001,
        distancesOctantXYZ101,
        distancesOctantXYZ011,
        distancesOctantXYZ111,
    ])
            
    return distancesOctants
}
