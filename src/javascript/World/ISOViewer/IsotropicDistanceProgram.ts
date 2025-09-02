import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class IsotropicDistancePassX implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], maxDistance: number = 255) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            int blockZ = outputCoords[0];
            int blockY = outputCoords[1];
            int blockX = outputCoords[2];

            // Sample occupancy of current block
            float blockOccupied = getA(blockZ, blockY, blockX, 0);

            // Early out if current block is already occupied
            if (blockOccupied == 255.0) 
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
                int leftBlockX = blockX - distanceX;
                if (leftBlockX >= 0)
                {
                    float leftOccupied = getA(blockZ, blockY, leftBlockX, 0);
                    if (leftOccupied == 255.0)
                    {
                        blockDistance = float(distanceX);
                        break;
                    }
                }

                int rightBlockX = blockX + distanceX;
                if (rightBlockX < ${inWidth})
                {
                    float rightOccupied = getA(blockZ, blockY, rightBlockX, 0);
                    if (rightOccupied == 255.0)
                    {
                        blockDistance = float(distanceX);
                        break;
                    }
                }
            }

            setOutput(blockDistance);
        }
        `
    }
}

class IsotropicDistancePassY implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], maxDistance: number = 255) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

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
            }

            setOutput(blockDistance);
        }
        `
    }
}

class IsotropicDistancePassZ implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], maxDistance: number = 255) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

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
            }

            setOutput(blockDistance);
        }
        `
    }
}

export function isotropicDistanceProgram(inputTensor: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    return tf.tidy(() => 
    {
        const backend = tf.backend() as MathBackendWebGL
        const shape = inputTensor.shape  as [number, number, number, number]

        const passX = new IsotropicDistancePassX(shape, maxDistance)
        const passY = new IsotropicDistancePassY(shape, maxDistance)
        const passZ = new IsotropicDistancePassZ(shape, maxDistance)

        const tensorX = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX, [inputTensor])) as tf.Tensor4D
        const tensorY = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passY, [tensorX])) as tf.Tensor4D
        const tensorZ = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ, [tensorY])) as tf.Tensor4D

        return tensorZ
    })
}