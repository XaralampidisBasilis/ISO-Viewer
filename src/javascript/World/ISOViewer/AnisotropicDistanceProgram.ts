import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class AnisotropicDistancePassX implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], passDirection: -1 | 1, maxDistance: number = 255) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

        bool outBounds(int neighborX) 
        { 
            return neighborX < 0 || ${inWidth} <= neighborX; 
        }

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

            // Scan along x dimension. Stop when you find an occupied block
            for (int i = 1; i <= ${Math.min(maxDistance, inWidth - 1)}; i++) 
            {
                // Compute neighbor block along x dimension based on pass direction
                int neighborX = ${passDirection < 0 ? 'blockX - i' : 'blockX + i'};

                // If neighbor x coordinate is outside the boundaries terminate loop
                if (outBounds(neighborX))
                {   
                    break;
                }

                // If neighbor is inside boundaries compute block occupancy
                float neighborOccupied = getA(blockZ, blockY, neighborX, 0);

                // If neighbor block is occupied update the distance and terminate loop
                if (neighborOccupied > 0.0)
                {
                    blockDistance = float(i);
                    break;
                }
            }

            setOutput(blockDistance);
        }
        `
    }
}

class AnisotropicDistancePassY implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], passDirection: -1 | 1, maxDistance: number = 255) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

        bool outBounds(int neighborY) 
        { 
            return neighborY < 0 || ${inHeight} <= neighborY; 
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            int blockZ = outputCoords[0];
            int blockY = outputCoords[1];
            int blockX = outputCoords[2];

            // Current best distance from previous pass in x dimension
            float blockDistance = getA(blockZ, blockY, blockX, 0);

            // Early out if current distance is less than one
            if (blockDistance <= 1.0) 
            {
                setOutput(blockDistance);
                return;
            }

            // Scan along y dimension
            for (int j = 1; j <= ${Math.min(maxDistance, inHeight - 1)}; j++) 
            {
                // Compute neighbor block along y dimension based on pass direction
                int neighborY = ${passDirection < 0 ? 'blockY - j' : 'blockY + j'};

                // If neighbor y coordinate is outside the boundaries terminate loop
                if (outBounds(neighborY))
                {
                    break;
                }

                // Compute distance components to the nearest candidate block
                float distanceX = getA(blockZ, neighborY, blockX, 0);
                float distanceY = float(j);

                // Chebyshev distance to this candidate block
                float candidateDistance = max(distanceX, distanceY);

                // Keep the smallest Chebyshev distance seen so far
                blockDistance = min(blockDistance, candidateDistance);

                // Early exit since in this case no further 
                // candidate  can improve the result
                if (distanceY >= blockDistance) 
                {
                    break;
                }
                
            }

            setOutput(blockDistance);
        }
        `
    }
}

class AnisotropicDistancePassZ implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], passDirection: -1 | 1, maxDistance: number = 255) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

        bool outBounds(int neighborZ) 
        { 
            return neighborZ < 0 || ${inDepth} <= neighborZ; 
        }

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

            // Scan along z dimension.
            for (int k = 1; k <= ${Math.min(maxDistance, inDepth - 1)}; k++) 
            {
                // Compute neighbor block along z dimension based on pass direction
                int neighborZ = ${passDirection < 0 ? 'blockZ - k' : 'blockZ + k'};

                // If neighbor z coordinate is outside the boundaries terminate loop
                if (outBounds(neighborZ))
                {
                    break;
                }

                // Compute distance components to the nearest candidate block
                float distanceXY = getA(neighborZ, blockY, blockX, 0);
                float distanceZ = float(k);

                // Chebyshev distance to this candidate block
                float candidateDistance = max(distanceXY, distanceZ);

                // Keep the smallest Chebyshev distance seen so far
                blockDistance = min(blockDistance, candidateDistance);

                // Early exit since in this case no further 
                // candidate  can improve the result
                if (distanceZ >= blockDistance) 
                {
                    break;
                }
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