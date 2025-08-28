import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class AnisotropicDistancePassX implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], inputDirection: -1 | 1, maxDistance: number = 255) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

        #ifndef PASS_DIRECTION
        #define PASS_DIRECTION ${inputDirection}
        #endif

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            int blockZ = outputCoords[0];
            int blockY = outputCoords[1];
            int blockX = outputCoords[2];

            bool blockOccupied = getA(blockZ, blockY, blockX, 0) > 127.5;
            float blockDistance = 0.0;

            // If current is occupied
            if (blockOccupied) 
            {
                setOutput(0.0);
                return;
            }

            for (int distanceX = 1; distanceX <= ${Math.min(maxDistance, inWidth - 1)}; distanceX++) 
            {
                #if PASS_DIRECTION < 0
                    
                    int leftX = blockX - distanceX;
                    if (leftX >= 0) 
                    {   
                        blockDistance = float(distanceX);
                        bool leftOccupied = getA(blockZ, blockY, leftX, 0) > 127.5;
                        if (leftOccupied)
                        {
                            break;
                        }
                    }

                #else
                        
                    int rightX = blockX + distanceX;
                    if (rightX < ${inWidth}) 
                    { 
                        blockDistance = float(distanceX);
                        bool rightOccupied = getA(blockZ, blockY, rightX, 0) > 127.5;
                        if (rightOccupied)
                        {
                            break;
                        }
                    }

                #endif
            }

            setOutput(blockDistance);
        }
        `
    }
}

export class AnisotropicDistancePassY implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], inputDirection: -1 | 1, maxDistance: number = 255) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

        #ifndef PASS_DIRECTION
        #define PASS_DIRECTION ${inputDirection}
        #endif

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            int blockZ = outputCoords[0];
            int blockY = outputCoords[1];
            int blockX = outputCoords[2];

            // Current best from X pass
            float blockDistance = getA(blockZ, blockY, blockX, 0);

            // Early out if already zero
            if (blockDistance <= 0.0) 
            {
                setOutput(0.0);
                return;
            }

            for (int distanceY = 1; distanceY < ${Math.min(maxDistance, inHeight - 1)}; distanceY++) 
            {
                #if PASS_DIRECTION < 0

                    if (float(distanceY) >= blockDistance) 
                    {
                        break;
                    }

                    int bottomY = blockY - distanceY;
                    if (bottomY >= 0) 
                    {
                        float distanceX = getA(blockZ, bottomY, blockX, 0);
                        float distance = max(float(distanceY), distanceX);
                        blockDistance = min(blockDistance, distance);
                    }

                #else

                    if (float(distanceY) >= blockDistance) 
                    {
                        break;
                    }

                    int topY = blockY + distanceY;
                    if (topY < ${inHeight}) 
                    {
                        float distanceX = getA(blockZ, topY, blockX, 0);
                        float distance = max(float(distanceY), distanceX);
                        blockDistance = min(blockDistance, distance);
                    }   

                #endif
            }

            setOutput(blockDistance);
        }
        `
    }
}

export class AnisotropicDistancePassZ implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], inputDirection: -1 | 1, maxDistance: number = 255) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

        #ifndef PASS_DIRECTION
        #define PASS_DIRECTION ${inputDirection}
        #endif

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            int blockZ = outputCoords[0];
            int blockY = outputCoords[1];
            int blockX = outputCoords[2];

            // Current best from XY pass
            float blockDistance = getA(blockZ, blockY, blockX, 0);

            // Early out if already zero
            if (blockDistance <= 0.0) 
            {
                setOutput(0.0);
                return;
            }

            // Zig-zag along Z. Stop when distanceZ >= blockDistance
            for (int distanceZ = 1; distanceZ < ${Math.min(maxDistance, inDepth - 1)}; distanceZ++) 
            {

                #if PASS_DIRECTION < 0

                    if (float(distanceZ) >= blockDistance) 
                    {
                        break;
                    }

                    int backZ = blockZ - distanceZ;
                    if (backZ >= 0) 
                    {
                        float distanceXY = getA(backZ, blockY, blockX, 0);
                        float distance = max(float(distanceZ), distanceXY);
                        blockDistance = min(blockDistance, distance);
                    }

                #else

                    if (float(distanceZ) >= blockDistance) 
                    {
                        break;
                    }

                    int frontZ = blockZ + distanceZ;
                    if (frontZ < ${inDepth}) 
                    {
                        float distanceXY = getA(frontZ, blockY, blockX, 0);
                        float distance = max(float(distanceZ), distanceXY);
                        blockDistance = min(blockDistance, distance);
                    }

                #endif
            }

            setOutput(blockDistance);
        }
        `
    }
}

export function anisotropicDistanceProgram(inputTensor: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    const shape = inputTensor.shape;

    const passX0 = new AnisotropicDistancePassX(shape, -1, maxDistance)
    const passX1 = new AnisotropicDistancePassX(shape, +1, maxDistance)
    const passY0 = new AnisotropicDistancePassY(shape, -1, maxDistance)
    const passY1 = new AnisotropicDistancePassY(shape, +1, maxDistance)
    const passZ0 = new AnisotropicDistancePassZ(shape, -1, maxDistance)
    const passZ1 = new AnisotropicDistancePassZ(shape, +1, maxDistance)

    const infoX0 = backend.compileAndRun(passX0, [inputTensor])
    const infoX1 = backend.compileAndRun(passX1, [inputTensor])
    
    const infoX0Y0 = backend.compileAndRun(passY0, [infoX0])
    const infoX0Y1 = backend.compileAndRun(passY1, [infoX0])
    const infoX1Y0 = backend.compileAndRun(passY0, [infoX1])
    const infoX1Y1 = backend.compileAndRun(passY1, [infoX1])

    const infoX0Y0Z0 = backend.compileAndRun(passZ0, [infoX0Y0])
    const infoX0Y0Z1 = backend.compileAndRun(passZ1, [infoX0Y0])
    const infoX0Y1Z0 = backend.compileAndRun(passZ0, [infoX0Y1])
    const infoX0Y1Z1 = backend.compileAndRun(passZ1, [infoX0Y1])
    const infoX1Y0Z0 = backend.compileAndRun(passZ0, [infoX1Y0])
    const infoX1Y0Z1 = backend.compileAndRun(passZ1, [infoX1Y0])
    const infoX1Y1Z0 = backend.compileAndRun(passZ0, [infoX1Y1])
    const infoX1Y1Z1 = backend.compileAndRun(passZ1, [infoX1Y1])

    const tensorX0Y0Z0 = tf.engine().makeTensorFromTensorInfo(infoX0Y0Z0)
    const tensorX0Y0Z1 = tf.engine().makeTensorFromTensorInfo(infoX0Y0Z1)
    const tensorX0Y1Z0 = tf.engine().makeTensorFromTensorInfo(infoX0Y1Z0)
    const tensorX0Y1Z1 = tf.engine().makeTensorFromTensorInfo(infoX0Y1Z1)
    const tensorX1Y0Z0 = tf.engine().makeTensorFromTensorInfo(infoX1Y0Z0)
    const tensorX1Y0Z1 = tf.engine().makeTensorFromTensorInfo(infoX1Y0Z1)
    const tensorX1Y1Z0 = tf.engine().makeTensorFromTensorInfo(infoX1Y1Z0)
    const tensorX1Y1Z1 = tf.engine().makeTensorFromTensorInfo(infoX1Y1Z1)
    
    // Concatenate directional distance maps in binary order
    const tensor = tf.concat([
        tensorX1Y1Z1, //tensorX0Y0Z0,
        tensorX1Y1Z1, //tensorX0Y0Z1,
        tensorX1Y1Z1, //tensorX0Y1Z0,
        tensorX1Y1Z1, //tensorX0Y1Z1,
        tensorX1Y1Z1, //tensorX1Y0Z0,
        tensorX1Y1Z1, //tensorX1Y0Z1,
        tensorX1Y1Z1, //tensorX1Y1Z0,
        tensorX1Y1Z1,
    ], 0)

    backend.disposeData(infoX0.dataId)
    backend.disposeData(infoX1.dataId)
    backend.disposeData(infoX0Y0.dataId)
    backend.disposeData(infoX0Y1.dataId)
    backend.disposeData(infoX1Y0.dataId)
    backend.disposeData(infoX1Y1.dataId)

    tf.dispose(tensorX0Y0Z0)
    tf.dispose(tensorX0Y0Z1)
    tf.dispose(tensorX0Y1Z0)
    tf.dispose(tensorX0Y1Z1)
    tf.dispose(tensorX1Y0Z0)
    tf.dispose(tensorX1Y0Z1)
    tf.dispose(tensorX1Y1Z0)
    tf.dispose(tensorX1Y1Z1)

    return tensor as tf.Tensor4D
}