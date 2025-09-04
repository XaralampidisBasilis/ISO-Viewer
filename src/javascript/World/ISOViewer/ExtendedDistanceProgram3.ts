import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class ExtendedDistancePass implements GPGPUProgram 
{
    variableNames = ['InputVariable']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        inputVariable: 'Distance' | 'Occupancy',
        inputDirection: '-X' | '+X' | '-Y' | '+Y' | '-Z' | '+Z',     
        maxDistance: number
    ) 
    {
        const [inSign, inAxis] = inputDirection.toLowerCase()
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        
        const getDistance = (x) => inputVariable == 'Occupancy' ?
            `getDistanceFromOccupancy(getInputVariable(${x}))` : 
            `getInputVariable(${x})`

        this.userCode = `
        const ivec3 maxCoords = ivec3(${inWidth - 1}, ${inHeight - 1}, ${inDepth - 1});
        const int maxSteps = clamp(${maxDistance}, 0, maxCoords.${inAxis}); 
        
        float getInputVariable(ivec3 coords) { return getInputVariable(coords.z, coords.y, coords.x, 0); }
        float getDistanceFromOccupancy(float occupancy) { return (occupancy > 0.0) ? 0.0 : ${maxDistance}.0 ; }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;
            ivec3 neighborCoords = blockCoords;

            float blockDistance = ${maxDistance}.0;
            for (int step = 0; step <= maxSteps; step++) 
            {
                neighborCoords.${inAxis} = blockCoords.${inAxis} ${inSign} step;
                if (${inSign == '-' ? 
                    `neighborCoords.${inAxis} < 0` : 
                    `neighborCoords.${inAxis} > maxCoords.${inAxis}`})
                {
                    break;
                }

                float neighborDistanceY = float(step);
                float neighborDistanceX = ${getDistance(`neighborCoords`)};
                if (neighborDistanceY >= neighborDistanceX) 
                {
                    blockDistance = neighborDistanceY;
                    break;
                }
            }

            setOutput(blockDistance);
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

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    return tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(prog, inputs)) as tf.Tensor4D
}

export function extendedDistanceProgram(inputOccupancy: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape as [number, number, number, number]

    // Programs
    const getDistanceBitpack = new ExtendedDistanceBitpack(shape)

    const getDistanceX0FromOccupancy = new ExtendedDistancePass(shape, 'Occupancy', '-X', maxDistance)
    const getDistanceX1FromOccupancy = new ExtendedDistancePass(shape, 'Occupancy', '+X', maxDistance)
    const getDistanceY0FromOccupancy = new ExtendedDistancePass(shape, 'Occupancy', '-Y', maxDistance)
    const getDistanceY1FromOccupancy = new ExtendedDistancePass(shape, 'Occupancy', '+Y', maxDistance)
    const getDistanceZ0FromOccupancy = new ExtendedDistancePass(shape, 'Occupancy', '-Z', maxDistance)
    const getDistanceZ1FromOccupancy = new ExtendedDistancePass(shape, 'Occupancy', '+Z', maxDistance)
    
    const getDistanceX0FromDistance = new ExtendedDistancePass(shape, 'Distance', '-X', maxDistance)
    const getDistanceX1FromDistance = new ExtendedDistancePass(shape, 'Distance', '+X', maxDistance)
    const getDistanceY0FromDistance = new ExtendedDistancePass(shape, 'Distance', '-Y', maxDistance)
    const getDistanceY1FromDistance = new ExtendedDistancePass(shape, 'Distance', '+Y', maxDistance)
    const getDistanceZ0FromDistance = new ExtendedDistancePass(shape, 'Distance', '-Z', maxDistance)
    const getDistanceZ1FromDistance = new ExtendedDistancePass(shape, 'Distance', '+Z', maxDistance)

    // 1D
    const distanceXDyadX0 = runProgram(getDistanceX0FromOccupancy, [inputOccupancy])
    const distanceXDyadX1 = runProgram(getDistanceX1FromOccupancy, [inputOccupancy])
    const distanceYDyadY0 = runProgram(getDistanceY0FromOccupancy, [inputOccupancy])
    const distanceYDyadY1 = runProgram(getDistanceY1FromOccupancy, [inputOccupancy])
    const distanceZDyadZ0 = runProgram(getDistanceZ0FromOccupancy, [inputOccupancy])
    const distanceZDyadZ1 = runProgram(getDistanceZ1FromOccupancy, [inputOccupancy])

    // 2D
    const distanceYQuadrantXY00 = runProgram(getDistanceY0FromDistance, [distanceXDyadX0]);
    const distanceYQuadrantXY01 = runProgram(getDistanceY1FromDistance, [distanceXDyadX0]); tf.dispose(distanceXDyadX0)  
    const distanceYQuadrantXY10 = runProgram(getDistanceY0FromDistance, [distanceXDyadX1]);
    const distanceYQuadrantXY11 = runProgram(getDistanceY1FromDistance, [distanceXDyadX1]); tf.dispose(distanceXDyadX1)
    const distanceZQuadrantYZ00 = runProgram(getDistanceZ0FromDistance, [distanceYDyadY0]);
    const distanceZQuadrantYZ01 = runProgram(getDistanceZ1FromDistance, [distanceYDyadY0]); tf.dispose(distanceYDyadY0)
    const distanceZQuadrantYZ10 = runProgram(getDistanceZ0FromDistance, [distanceYDyadY1]);
    const distanceZQuadrantYZ11 = runProgram(getDistanceZ1FromDistance, [distanceYDyadY1]); tf.dispose(distanceYDyadY1)
    const distanceXQuadrantXZ00 = runProgram(getDistanceX0FromDistance, [distanceZDyadZ0]);
    const distanceXQuadrantXZ10 = runProgram(getDistanceX1FromDistance, [distanceZDyadZ0]); tf.dispose(distanceZDyadZ0)
    const distanceXQuadrantXZ01 = runProgram(getDistanceX0FromDistance, [distanceZDyadZ1]);
    const distanceXQuadrantXZ11 = runProgram(getDistanceX1FromDistance, [distanceZDyadZ1]); tf.dispose(distanceZDyadZ1)

    // 3D
    const distanceZOctantXYZ000 = runProgram(getDistanceZ0FromDistance, [distanceYQuadrantXY00]);
    const distanceZOctantXYZ001 = runProgram(getDistanceZ1FromDistance, [distanceYQuadrantXY00]); tf.dispose(distanceYQuadrantXY00)
    const distanceZOctantXYZ010 = runProgram(getDistanceZ0FromDistance, [distanceYQuadrantXY01]);
    const distanceZOctantXYZ011 = runProgram(getDistanceZ1FromDistance, [distanceYQuadrantXY01]); tf.dispose(distanceYQuadrantXY01)
    const distanceZOctantXYZ100 = runProgram(getDistanceZ0FromDistance, [distanceYQuadrantXY10]);
    const distanceZOctantXYZ101 = runProgram(getDistanceZ1FromDistance, [distanceYQuadrantXY10]); tf.dispose(distanceYQuadrantXY10)
    const distanceZOctantXYZ110 = runProgram(getDistanceZ0FromDistance, [distanceYQuadrantXY11]);
    const distanceZOctantXYZ111 = runProgram(getDistanceZ1FromDistance, [distanceYQuadrantXY11]); tf.dispose(distanceYQuadrantXY11)

    const distanceXOctantXYZ000 = runProgram(getDistanceX0FromDistance, [distanceZQuadrantYZ00]);
    const distanceXOctantXYZ100 = runProgram(getDistanceX1FromDistance, [distanceZQuadrantYZ00]); tf.dispose(distanceZQuadrantYZ00)
    const distanceXOctantXYZ001 = runProgram(getDistanceX0FromDistance, [distanceZQuadrantYZ01]);
    const distanceXOctantXYZ101 = runProgram(getDistanceX1FromDistance, [distanceZQuadrantYZ01]); tf.dispose(distanceZQuadrantYZ01)
    const distanceXOctantXYZ010 = runProgram(getDistanceX0FromDistance, [distanceZQuadrantYZ10]);
    const distanceXOctantXYZ110 = runProgram(getDistanceX1FromDistance, [distanceZQuadrantYZ10]); tf.dispose(distanceZQuadrantYZ10)
    const distanceXOctantXYZ011 = runProgram(getDistanceX0FromDistance, [distanceZQuadrantYZ11]);
    const distanceXOctantXYZ111 = runProgram(getDistanceX1FromDistance, [distanceZQuadrantYZ11]); tf.dispose(distanceZQuadrantYZ11)
    const distanceYOctantXYZ000 = runProgram(getDistanceY0FromDistance, [distanceXQuadrantXZ00]);
    const distanceYOctantXYZ010 = runProgram(getDistanceY1FromDistance, [distanceXQuadrantXZ00]); tf.dispose(distanceXQuadrantXZ00)
    const distanceYOctantXYZ100 = runProgram(getDistanceY0FromDistance, [distanceXQuadrantXZ10]);
    const distanceYOctantXYZ110 = runProgram(getDistanceY1FromDistance, [distanceXQuadrantXZ10]); tf.dispose(distanceXQuadrantXZ10)
    const distanceYOctantXYZ001 = runProgram(getDistanceY0FromDistance, [distanceXQuadrantXZ01]);
    const distanceYOctantXYZ011 = runProgram(getDistanceY1FromDistance, [distanceXQuadrantXZ01]); tf.dispose(distanceXQuadrantXZ01)
    const distanceYOctantXYZ101 = runProgram(getDistanceY0FromDistance, [distanceXQuadrantXZ11]);
    const distanceYOctantXYZ111 = runProgram(getDistanceY1FromDistance, [distanceXQuadrantXZ11]); tf.dispose(distanceXQuadrantXZ11)

    // Packing
    const bitpackedDistancesOctantXYZ000 = runProgram(getDistanceBitpack, [distanceXOctantXYZ000, distanceYOctantXYZ000, distanceZOctantXYZ000, inputOccupancy]); tf.dispose([distanceXOctantXYZ000, distanceYOctantXYZ000, distanceZOctantXYZ000])
    const bitpackedDistancesOctantXYZ001 = runProgram(getDistanceBitpack, [distanceXOctantXYZ001, distanceYOctantXYZ001, distanceZOctantXYZ001, inputOccupancy]); tf.dispose([distanceXOctantXYZ001, distanceYOctantXYZ001, distanceZOctantXYZ001])
    const bitpackedDistancesOctantXYZ010 = runProgram(getDistanceBitpack, [distanceXOctantXYZ010, distanceYOctantXYZ010, distanceZOctantXYZ010, inputOccupancy]); tf.dispose([distanceXOctantXYZ010, distanceYOctantXYZ010, distanceZOctantXYZ010])
    const bitpackedDistancesOctantXYZ011 = runProgram(getDistanceBitpack, [distanceXOctantXYZ011, distanceYOctantXYZ011, distanceZOctantXYZ011, inputOccupancy]); tf.dispose([distanceXOctantXYZ011, distanceYOctantXYZ011, distanceZOctantXYZ011])
    const bitpackedDistancesOctantXYZ100 = runProgram(getDistanceBitpack, [distanceXOctantXYZ100, distanceYOctantXYZ100, distanceZOctantXYZ100, inputOccupancy]); tf.dispose([distanceXOctantXYZ100, distanceYOctantXYZ100, distanceZOctantXYZ100])
    const bitpackedDistancesOctantXYZ101 = runProgram(getDistanceBitpack, [distanceXOctantXYZ101, distanceYOctantXYZ101, distanceZOctantXYZ101, inputOccupancy]); tf.dispose([distanceXOctantXYZ101, distanceYOctantXYZ101, distanceZOctantXYZ101])
    const bitpackedDistancesOctantXYZ110 = runProgram(getDistanceBitpack, [distanceXOctantXYZ110, distanceYOctantXYZ110, distanceZOctantXYZ110, inputOccupancy]); tf.dispose([distanceXOctantXYZ110, distanceYOctantXYZ110, distanceZOctantXYZ110])
    const bitpackedDistancesOctantXYZ111 = runProgram(getDistanceBitpack, [distanceXOctantXYZ111, distanceYOctantXYZ111, distanceZOctantXYZ111, inputOccupancy]); tf.dispose([distanceXOctantXYZ111, distanceYOctantXYZ111, distanceZOctantXYZ111])

    // Concatenate
    const bitpackedDistances = tf.concat([
        bitpackedDistancesOctantXYZ000,
        bitpackedDistancesOctantXYZ001,
        bitpackedDistancesOctantXYZ010,
        bitpackedDistancesOctantXYZ011,
        bitpackedDistancesOctantXYZ100,
        bitpackedDistancesOctantXYZ101,
        bitpackedDistancesOctantXYZ110,
        bitpackedDistancesOctantXYZ111,
    ], 0)

    tf.dispose([
        bitpackedDistancesOctantXYZ000,
        bitpackedDistancesOctantXYZ001,
        bitpackedDistancesOctantXYZ010,
        bitpackedDistancesOctantXYZ011,
        bitpackedDistancesOctantXYZ100,
        bitpackedDistancesOctantXYZ101,
        bitpackedDistancesOctantXYZ110,
        bitpackedDistancesOctantXYZ111,
    ])
            
    return bitpackedDistances as tf.Tensor4D
}
