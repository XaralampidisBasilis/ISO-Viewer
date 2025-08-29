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

            // Sample occupancy of current block
            float blockOccupied = getA(blockZ, blockY, blockX, 0);

            // Early out if current block is already occupied
            if (blockOccupied > 0.0) 
            {
                setOutput(0.0);
                return;
            }

            // If there is no hit with occupied block set maximum distance
            float blockDistance = ${maxDistance}.0;

            // Zig-zag along x dimension. Stop when you find an occupied block
            const int maxDistanceX = ${Math.min(maxDistance, inWidth - 1)};
            for (int distanceX = 1; distanceX <= maxDistanceX; distanceX++) 
            {
                #if PASS_DIRECTION < 0
                
                int leftBlockX = blockX - distanceX;
                if (leftBlockX >= 0)
                {
                    float leftOccupied = getA(blockZ, blockY, leftBlockX, 0);
                    if (leftOccupied > 0.0)
                    {
                        blockDistance = float(distanceX);
                        break;
                    }
                }

                #else

                int rightBlockX = blockX + distanceX;
                if (rightBlockX < ${inWidth})
                {
                    float rightOccupied = getA(blockZ, blockY, rightBlockX, 0);
                    if (rightOccupied > 0.0)
                    {
                        blockDistance = float(distanceX);
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

            // Current best from previous pass in x dimension
            float blockDistance = getA(blockZ, blockY, blockX, 0);

            // Early out if current distance is less than one
            if (blockDistance <= 1.0) 
            {
                setOutput(blockDistance);
                return;
            }

            // Zig-zag along y dimension. Stop when current distance is greater than previous
            const int maxDistanceY = ${Math.min(maxDistance, inHeight - 1)};
            for (int distanceY = 1; distanceY <= maxDistanceY; distanceY++) 
            {
                #if PASS_DIRECTION < 0

                int downBlockY = blockY - distanceY;
                if (downBlockY >= 0) 
                {
                    float downDistanceX = getA(blockZ, downBlockY, blockX, 0);
                    blockDistance = clamp(float(distanceY), downDistanceX, blockDistance);
                    if (float(distanceY) >= blockDistance) 
                    {
                        break;
                    }
                }

                #else

                int upBlockY = blockY + distanceY;
                if (upBlockY < ${inHeight}) 
                {
                    float upDistanceX = getA(blockZ, upBlockY, blockX, 0);
                    blockDistance = clamp(float(distanceY), upDistanceX, blockDistance);
                    if (float(distanceY) >= blockDistance) 
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

            // Current best from previous pass in y dimension
            float blockDistance = getA(blockZ, blockY, blockX, 0);

            // Early out if current distance is less than one
            if (blockDistance <= 1.0) 
            {
                setOutput(blockDistance);
                return;
            }

            // Zig-zag along z dimension. Stop when current distance is greater than previous
            const int maxDistanceZ = ${Math.min(maxDistance, inDepth - 1)};
            for (int distanceZ = 1; distanceZ <= maxDistanceZ; distanceZ++) 
            {
                #if PASS_DIRECTION < 0

                int backBlockZ = blockZ - distanceZ;
                if (backBlockZ >= 0) 
                {
                    float backDistanceXY = getA(backBlockZ, blockY, blockX, 0);
                    blockDistance = clamp(float(distanceZ), backDistanceXY, blockDistance);
                    if (float(distanceZ) >= blockDistance) 
                    {
                        break;
                    }
                }

                #else

                int frontBlockZ = blockZ + distanceZ;
                if (frontBlockZ < ${inDepth}) 
                {
                    float frontDistanceXY = getA(frontBlockZ, blockY, blockX, 0);
                    blockDistance = clamp(float(distanceZ), frontDistanceXY, blockDistance);
                    if (float(distanceZ) >= blockDistance) 
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
export function anisotropicDistanceProgram(inputTensor: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    return tf.tidy(() => 
    {
        const backend = tf.backend() as MathBackendWebGL
        const shape = inputTensor.shape as [number, number, number, number]

        const passX0 = new AnisotropicDistancePassX(shape, -1, maxDistance)
        const passX1 = new AnisotropicDistancePassX(shape, +1, maxDistance)
        const passY0 = new AnisotropicDistancePassY(shape, -1, maxDistance)
        const passY1 = new AnisotropicDistancePassY(shape, +1, maxDistance)
        const passZ0 = new AnisotropicDistancePassZ(shape, -1, maxDistance)
        const passZ1 = new AnisotropicDistancePassZ(shape, +1, maxDistance)

        // X passes
        const tensorX0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX0, [inputTensor])) as tf.Tensor4D
        const tensorX1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX1, [inputTensor])) as tf.Tensor4D

        // Y passes
        const tensorX0Y0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passY0, [tensorX0])) as tf.Tensor4D
        const tensorX0Y1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passY1, [tensorX0])) as tf.Tensor4D
        const tensorX1Y0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passY0, [tensorX1])) as tf.Tensor4D
        const tensorX1Y1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passY1, [tensorX1])) as tf.Tensor4D

        // Z passes
        const tensorX0Y0Z0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ0, [tensorX0Y0])) as tf.Tensor4D
        const tensorX0Y0Z1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ1, [tensorX0Y0])) as tf.Tensor4D
        const tensorX0Y1Z0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ0, [tensorX0Y1])) as tf.Tensor4D
        const tensorX0Y1Z1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ1, [tensorX0Y1])) as tf.Tensor4D
        const tensorX1Y0Z0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ0, [tensorX1Y0])) as tf.Tensor4D
        const tensorX1Y0Z1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ1, [tensorX1Y0])) as tf.Tensor4D
        const tensorX1Y1Z0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ0, [tensorX1Y1])) as tf.Tensor4D
        const tensorX1Y1Z1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ1, [tensorX1Y1])) as tf.Tensor4D
        
        // Concatenate directional distance maps in binary order
        const tensor = tf.concat([
            tensorX0Y0Z0,
            tensorX0Y0Z1,
            tensorX0Y1Z0,
            tensorX0Y1Z1,
            tensorX1Y0Z0,
            tensorX1Y0Z1,
            tensorX1Y1Z0,
            tensorX1Y1Z1,
        ], 0)

        return tensor as tf.Tensor4D
    })
}