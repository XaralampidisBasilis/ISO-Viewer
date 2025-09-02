import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'


class ExtendedDistanceFirstPass implements GPGPUProgram 
{
    variableNames = ['Occupancy']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        passAxis: 0 | 1 |2,                          
        passDirection: -1 | 1,                        
        passDistance: number = 255
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]

        const size = [inDepth, inHeight, inWidth][passAxis];
        const maxDistance = Math.min(passDistance, size - 1)

        const axis = ['z', 'y', 'x'][passAxis]
        const sign = (passDirection < 0) ? `-` : `+`
       
        this.userCode = `
        void main() 
        {
            ivec4 outputCoords = getOutputCoords();

            ivec3 blockCoords = outputCoords.zyx;
            ivec3 neighborCoords = blockCoords;
        
            bool blockOccupied = getA(blockCoords.z, blockCoords.y, blockCoords.x, 0) > 0.0;
            if (blockOccupied) 
            {
                setOutput(0.0);
                return;
            }

            float blockDistance = ${maxDistance}.0;
            
            for (int distance = 1; distance <= ${maxDistance}; distance++) 
            {
                neighborCoords.${axis} = blockCoords.${axis} ${sign} distance;
                if (neighborCoords.${axis} < 0 || neighborCoords.${axis} >= ${size}) 
                {
                    break;
                }

                bool neighborOccupied = getOccupancy(neighborCoords.z, neighborCoords.y, neighborCoords.x, 0) > 0.0;
                if (neighborOccupied) 
                {
                    blockDistance = float(distance);
                    break;
                }
            }

            setOutput(blockDistance);
        }
        `
    }
}

class ExtendedDistanceSecondPass implements GPGPUProgram 
{
    variableNames = ['Distance']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        passAxis: 0 | 1 | 2, 
        passDirection: -1 | 1, 
        passDistance: number = 255
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]

        // Axis-specific metadata
        const size = [inDepth, inHeight, inWidth][passAxis];
        const maxDistance = Math.min(passDistance, size - 1)

        const axis = ['z', 'y', 'x'][passAxis]
        const sign = passDirection < 0 ? `-` : `+`

        this.userCode = `
        void main() 
        {
            ivec4 outputCoords = getOutputCoords();

            ivec3 blockCoords = outputCoords.zyx;
            ivec3 neighborCoords = blockCoords;

            bool blockOccupied = getA(blockCoords.z, blockCoords.y, blockCoords.x, 0) == 0.0;
            if (blockOccupied) 
            {
                setOutput(0.0);
                return;
            }

            float blockDistance = 0.0;
            vec2 neighborDistances = vec2(0.0);

            for (int distance = 1; distance <= ${maxDistance}; distance++) 
            {
                neighborCoords.${axis} = blockCoords.${axis} ${sign} distance;
                if (neighborCoords.${axis} < 0 || neighborCoords.${axis} >= ${size})
                {
                    break;
                }

                neighborDistances.x = getDistance(neighborCoords.z, neighborCoords.y, neighborCoords.x, 0);
                neighborDistances.y = float(distance);

                if (neighborDistances.y >= neighborDistances.x) 
                {
                    blockDistance = neighborDistances.y;
                    break;
                }
            }

            setOutput(blockDistance);
        }
        `
    }
}

class ExtendedDistanceThirdPass implements GPGPUProgram 
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

            int blockDistanceX = int(getDistanceX(blockCoords.z, blockCoords.y, blockCoords.x, 0));
            int blockDistanceY = int(getDistanceY(blockCoords.z, blockCoords.y, blockCoords.x, 0));
            int blockDistanceZ = int(getDistanceZ(blockCoords.z, blockCoords.y, blockCoords.x, 0));
            int blockDistance = 0;

            blockDistanceX = clamp(blockDistanceX, 0, 31);
            blockDistanceY = clamp(blockDistanceY, 0, 31);
            blockDistanceZ = clamp(blockDistanceZ, 0, 31);

            blockDistance = min(blockDistance, blockDistanceX);
            blockDistance = min(blockDistance, blockDistanceY);
            blockDistance = min(blockDistance, blockDistanceZ);
            
            int blockOccupancy = (blockDistance == 0 ? 1 : 0;

            ivec4 blockDistances = ivec4(blockDistanceX, blockDistanceY, blockDistanceZ, blockOccupancy) * ivec4(2048, 64, 2, 1);
            int blockPacked = blockDistances.r + blockDistances.g + blockDistances.b + blockDistances.a;

            setOutput(float(blockPacked));
        }
        `
    }
}

export function extendedDistanceProgram(inputTensor: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    return tf.tidy(() => 
    {
        const backend = tf.backend() as MathBackendWebGL
        const shape = inputTensor.shape as [number, number, number, number]

        const firstPassX0 = new ExtendedDistanceFirstPass(shape, 2, -1, maxDistance)
        const firstPassX1 = new ExtendedDistanceFirstPass(shape, 2, +1, maxDistance)
        const firstPassY0 = new ExtendedDistanceFirstPass(shape, 1, -1, maxDistance)
        const firstPassY1 = new ExtendedDistanceFirstPass(shape, 1, +1, maxDistance)
        const firstPassZ0 = new ExtendedDistanceFirstPass(shape, 0, -1, maxDistance)
        const firstPassZ1 = new ExtendedDistanceFirstPass(shape, 0, +1, maxDistance)
        
        const secondPassX0 = new ExtendedDistanceSecondPass(shape, 2, -1, maxDistance)
        const secondPassX1 = new ExtendedDistanceSecondPass(shape, 2, +1, maxDistance)
        const secondPassY0 = new ExtendedDistanceSecondPass(shape, 1, -1, maxDistance)
        const secondPassY1 = new ExtendedDistanceSecondPass(shape, 1, +1, maxDistance)
        const secondPassZ0 = new ExtendedDistanceSecondPass(shape, 0, -1, maxDistance)
        const secondPassZ1 = new ExtendedDistanceSecondPass(shape, 0, +1, maxDistance)

        const thirdPass = new ExtendedDistanceThirdPass(shape)

        const tensorX0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(firstPassX0, [inputTensor])) as tf.Tensor4D
        const tensorX1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(firstPassX1, [inputTensor])) as tf.Tensor4D
        const tensorY0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(firstPassY0, [inputTensor])) as tf.Tensor4D
        const tensorY1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(firstPassY1, [inputTensor])) as tf.Tensor4D
        const tensorZ0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(firstPassZ0, [inputTensor])) as tf.Tensor4D
        const tensorZ1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(firstPassZ1, [inputTensor])) as tf.Tensor4D

        const tensorY00 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY0, [tensorX0])) as tf.Tensor4D
        const tensorY01 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY1, [tensorX0])) as tf.Tensor4D
        tensorX0.dispose()

        const tensorY10 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY0, [tensorX1])) as tf.Tensor4D
        const tensorY11 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY1, [tensorX1])) as tf.Tensor4D
        tensorX1.dispose()

        const tensorZ00 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ0, [tensorY0])) as tf.Tensor4D
        const tensorZ01 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ1, [tensorY0])) as tf.Tensor4D
        tensorY0.dispose()

        const tensorZ10 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ0, [tensorY1])) as tf.Tensor4D
        const tensorZ11 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ1, [tensorY1])) as tf.Tensor4D
        tensorY1.dispose()

        const tensorX00 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX0, [tensorZ0])) as tf.Tensor4D
        const tensorX10 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX1, [tensorZ0])) as tf.Tensor4D
        tensorZ0.dispose()

        const tensorX01 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX0, [tensorZ1])) as tf.Tensor4D
        const tensorX11 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX1, [tensorZ1])) as tf.Tensor4D
        tensorZ1.dispose()

        const tensorZ000 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ0, [tensorY00])) as tf.Tensor4D
        const tensorZ001 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ1, [tensorY00])) as tf.Tensor4D
        tensorY00.dispose()
    
        const tensorZ010 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ0, [tensorY01])) as tf.Tensor4D
        const tensorZ011 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ1, [tensorY01])) as tf.Tensor4D
        tensorY01.dispose()

        const tensorZ100 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ0, [tensorY10])) as tf.Tensor4D
        const tensorZ101 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ1, [tensorY10])) as tf.Tensor4D
        tensorY10.dispose()

        const tensorZ110 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ0, [tensorY11])) as tf.Tensor4D
        const tensorZ111 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassZ1, [tensorY11])) as tf.Tensor4D
        tensorY11.dispose()

        const tensorX000 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX0, [tensorZ00])) as tf.Tensor4D
        const tensorX100 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX1, [tensorZ00])) as tf.Tensor4D
        tensorZ00.dispose()

        const tensorX001 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX0, [tensorZ01])) as tf.Tensor4D
        const tensorX101 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX1, [tensorZ01])) as tf.Tensor4D
        tensorZ01.dispose()

        const tensorX010 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX0, [tensorZ10])) as tf.Tensor4D
        const tensorX110 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX1, [tensorZ10])) as tf.Tensor4D
        tensorZ10.dispose()

        const tensorX011 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX0, [tensorZ11])) as tf.Tensor4D
        const tensorX111 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassX1, [tensorZ11])) as tf.Tensor4D
        tensorZ11.dispose()

        const tensorY000 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY0, [tensorX00])) as tf.Tensor4D
        const tensorY010 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY1, [tensorX00])) as tf.Tensor4D
        tensorX00.dispose()

        const tensorY100 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY0, [tensorX10])) as tf.Tensor4D
        const tensorY110 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY1, [tensorX10])) as tf.Tensor4D
        tensorX10.dispose()

        const tensorY001 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY0, [tensorX01])) as tf.Tensor4D
        const tensorY011 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY1, [tensorX01])) as tf.Tensor4D
        tensorX01.dispose()

        const tensorY101 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY0, [tensorX11])) as tf.Tensor4D
        const tensorY111 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(secondPassY1, [tensorX11])) as tf.Tensor4D
        tensorX11.dispose()

        const tensorXYZ000 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(thirdPass, [tensorX000, tensorY000, tensorZ000])) as tf.Tensor4D
        tf.dispose([tensorX000, tensorY000, tensorZ000])

        const tensorXYZ001 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(thirdPass, [tensorX001, tensorY001, tensorZ001])) as tf.Tensor4D
        tf.dispose([tensorX001, tensorY001, tensorZ001])

        const tensorXYZ010 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(thirdPass, [tensorX010, tensorY010, tensorZ010])) as tf.Tensor4D
        tf.dispose([tensorX010, tensorY010, tensorZ010])

        const tensorXYZ011 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(thirdPass, [tensorX011, tensorY011, tensorZ011])) as tf.Tensor4D
        tf.dispose([tensorX011, tensorY011, tensorZ011])

        const tensorXYZ100 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(thirdPass, [tensorX100, tensorY100, tensorZ100])) as tf.Tensor4D
        tf.dispose([tensorX100, tensorY100, tensorZ100])

        const tensorXYZ101 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(thirdPass, [tensorX101, tensorY101, tensorZ101])) as tf.Tensor4D
        tf.dispose([tensorX101, tensorY101, tensorZ101])

        const tensorXYZ110 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(thirdPass, [tensorX110, tensorY110, tensorZ110])) as tf.Tensor4D
        tf.dispose([tensorX110, tensorY110, tensorZ110])

        const tensorXYZ111 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(thirdPass, [tensorX111, tensorY111, tensorZ111])) as tf.Tensor4D
        tf.dispose([tensorX111, tensorY111, tensorZ111])

        const tensor = tf.concat([
            tensorXYZ000,
            tensorXYZ001,
            tensorXYZ010,
            tensorXYZ011,
            tensorXYZ100,
            tensorXYZ101,
            tensorXYZ110,
            tensorXYZ111,
        ], 0)

        tf.dispose([
            tensorXYZ000,
            tensorXYZ001,
            tensorXYZ010,
            tensorXYZ011,
            tensorXYZ100,
            tensorXYZ101,
            tensorXYZ110,
            tensorXYZ111,
        ])

        return tensor as tf.Tensor4D
    })
}
