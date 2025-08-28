import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class IsotropicDistancePassX implements GPGPUProgram 
{
    variableNames = ['A']
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

            for (int distanceX = 1; distanceX <= ${Math.min(255, inWidth - 1)}; distanceX++) 
            {
                int leftX = blockX - distanceX;
                if (leftX >= 0) 
                { 
                    bool leftOccupied = getA(blockZ, blockY, leftX, 0) > 127.5;
                    blockDistance = float(distanceX);

                    if (leftOccupied)
                    {
                        break;
                    }
                }
                    
                int rightX = blockX + distanceX;
                if (rightX < ${inWidth}) 
                { 
                    bool rightOccupied = getA(blockZ, blockY, rightX, 0) > 127.5;
                    blockDistance = float(distanceX);
                    
                    if (rightOccupied)
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

export class IsotropicDistancePassY implements GPGPUProgram 
{
    variableNames = ['A']
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
            int blockZ = outputCoords[0];
            int blockY = outputCoords[1];
            int blockX = outputCoords[2];

            // Current best from X pass, clamp into [0,255]
            float blockDistance = getA(blockZ, blockY, blockX, 0);
            blockDistance = clamp(blockDistance, 0.0, 255.0);

            // Early out if already zero
            if (blockDistance <= 0.0) 
            {
                setOutput(0.0);
                return;
            }

            // Zig-zag along Y. Stop when distanceY >= blockDistance
            for (int distanceY = 1; distanceY < ${Math.min(255, inHeight - 1)}; ++distanceY) 
            {
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
            }

            setOutput(blockDistance);
        }
        `
    }
}

export class IsotropicDistancePassZ implements GPGPUProgram 
{
    variableNames = ['A']
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
            int blockZ = outputCoords[0];
            int blockY = outputCoords[1];
            int blockX = outputCoords[2];

            // Current best from XY pass, clamp into [0,255]
            float blockDistance = getA(blockZ, blockY, blockX, 0);
            blockDistance = clamp(blockDistance, 0.0, 255.0);

            // Early out if already zero
            if (blockDistance <= 0.0) 
            {
                setOutput(0.0);
                return;
            }

            // Zig-zag along Z. Stop when distanceZ >= blockDistance
            for (int distanceZ = 1; distanceZ < ${Math.min(255, inDepth - 1)}; ++distanceZ) 
            {
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
            }

            setOutput(blockDistance);
        }
        `
    }
}

export function isotropicDistanceProgram(input: tf.Tensor4D): tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    const shape = input.shape;

    const passX = new IsotropicDistancePassX(shape)
    const infoX = backend.compileAndRun(passX, [input])

    const passY = new IsotropicDistancePassY(shape)
    const infoY = backend.compileAndRun(passY, [infoX])

    const passZ = new IsotropicDistancePassZ(shape)
    const infoZ = backend.compileAndRun(passZ, [infoY])

    backend.disposeData(infoX.dataId)
    backend.disposeData(infoY.dataId)

    return tf.engine().makeTensorFromTensorInfo(infoZ) as tf.Tensor4D
}