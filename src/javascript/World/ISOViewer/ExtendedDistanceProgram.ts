import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class ExtendedDistancePass implements GPGPUProgram 
{
    variableNames = ['A']
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
        const [sign, axis] = inputDirection.toLowerCase()
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        
        const getDistance = (x: string) => inputVariable == 'Occupancy' ?
            `getDistanceFromOccupancy(getInputVariable(${x}))` : 
            `getInputVariable(${x})`

        this.userCode = `
        const ivec3 maxCoords = ivec3(${inWidth - 1}, ${inHeight - 1}, ${inDepth - 1});
        const int maxDistance = min(${maxDistance}, maxCoords.${axis}); 
        
        float getInputVariable(ivec3 coords) { return getA(coords.z, coords.y, coords.x, 0); }
        float getDistanceFromOccupancy(float occupancy) { return (occupancy > 0.0) ? 0.0 : float(maxDistance) ; }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            
            ivec3 blockCoords = outputCoords.zyx;
            float blockDistance = float(maxDistance);

            ivec3 neighborCoords = blockCoords;

            for (int distance = 0; distance <= maxDistance; distance++) 
            {
                neighborCoords.${axis} = blockCoords.${axis} ${sign} distance;
                if (${sign == '-' ? `neighborCoords.${axis} < 0` : `neighborCoords.${axis} > maxCoords.${axis}`})
                {
                    break;
                }

                float neighborDistanceY = float(distance);
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
    variableNames = ['DistanceX', 'DistanceY', 'DistanceZ']
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

            blockDistances.a = min(blockDistances.x, min(blockDistances.y, blockDistances.z));
            blockDistances.a = (blockDistances.a == 0) ? 1 : 0;

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

    const getBitpackDistance = new ExtendedDistanceBitpack(shape)

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

    const distanceXDyadX0 = runProgram(getDistanceX0FromOccupancy, [inputOccupancy])
    const distanceXDyadX1 = runProgram(getDistanceX1FromOccupancy, [inputOccupancy])
    const distanceYDyadY0 = runProgram(getDistanceY0FromOccupancy, [inputOccupancy])
    const distanceYDyadY1 = runProgram(getDistanceY1FromOccupancy, [inputOccupancy])
    const distanceZDyadZ0 = runProgram(getDistanceZ0FromOccupancy, [inputOccupancy])
    const distanceZDyadZ1 = runProgram(getDistanceZ1FromOccupancy, [inputOccupancy])

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

    const distanceXYZOctantXYZ000 = runProgram(getBitpackDistance, [distanceXOctantXYZ000, distanceYOctantXYZ000, distanceZOctantXYZ000]); tf.dispose([distanceXOctantXYZ000, distanceYOctantXYZ000, distanceZOctantXYZ000])
    const distanceXYZOctantXYZ001 = runProgram(getBitpackDistance, [distanceXOctantXYZ001, distanceYOctantXYZ001, distanceZOctantXYZ001]); tf.dispose([distanceXOctantXYZ001, distanceYOctantXYZ001, distanceZOctantXYZ001])
    const distanceXYZOctantXYZ010 = runProgram(getBitpackDistance, [distanceXOctantXYZ010, distanceYOctantXYZ010, distanceZOctantXYZ010]); tf.dispose([distanceXOctantXYZ010, distanceYOctantXYZ010, distanceZOctantXYZ010])
    const distanceXYZOctantXYZ011 = runProgram(getBitpackDistance, [distanceXOctantXYZ011, distanceYOctantXYZ011, distanceZOctantXYZ011]); tf.dispose([distanceXOctantXYZ011, distanceYOctantXYZ011, distanceZOctantXYZ011])
    const distanceXYZOctantXYZ100 = runProgram(getBitpackDistance, [distanceXOctantXYZ100, distanceYOctantXYZ100, distanceZOctantXYZ100]); tf.dispose([distanceXOctantXYZ100, distanceYOctantXYZ100, distanceZOctantXYZ100])
    const distanceXYZOctantXYZ101 = runProgram(getBitpackDistance, [distanceXOctantXYZ101, distanceYOctantXYZ101, distanceZOctantXYZ101]); tf.dispose([distanceXOctantXYZ101, distanceYOctantXYZ101, distanceZOctantXYZ101])
    const distanceXYZOctantXYZ110 = runProgram(getBitpackDistance, [distanceXOctantXYZ110, distanceYOctantXYZ110, distanceZOctantXYZ110]); tf.dispose([distanceXOctantXYZ110, distanceYOctantXYZ110, distanceZOctantXYZ110])
    const distanceXYZOctantXYZ111 = runProgram(getBitpackDistance, [distanceXOctantXYZ111, distanceYOctantXYZ111, distanceZOctantXYZ111]); tf.dispose([distanceXOctantXYZ111, distanceYOctantXYZ111, distanceZOctantXYZ111])

    const distanceXYZ = tf.concat([
        distanceXYZOctantXYZ000,
        distanceXYZOctantXYZ001,
        distanceXYZOctantXYZ010,
        distanceXYZOctantXYZ011,
        distanceXYZOctantXYZ100,
        distanceXYZOctantXYZ101,
        distanceXYZOctantXYZ110,
        distanceXYZOctantXYZ111,
    ], 0)

    tf.dispose([
        distanceXYZOctantXYZ000,
        distanceXYZOctantXYZ001,
        distanceXYZOctantXYZ010,
        distanceXYZOctantXYZ011,
        distanceXYZOctantXYZ100,
        distanceXYZOctantXYZ101,
        distanceXYZOctantXYZ110,
        distanceXYZOctantXYZ111,
    ])
            
    return distanceXYZ as tf.Tensor4D
}
