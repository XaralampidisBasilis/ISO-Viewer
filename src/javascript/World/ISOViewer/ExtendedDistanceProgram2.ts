import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class ExtendedDistancePassX implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], passDirection: number, maxDistance: number = 31) 
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
            if (blockOccupied > 0.0) 
            {
                setOutput(0.0);
                return;
            }

            // If there is no hit with occupied block set maximum distance
            float blockDistance = ${maxDistance}.0;

            // Compute max distance in x dimension
            const int maxDistanceX = ${Math.min(maxDistance, inWidth - 1)};

            // Zig-zag along x dimension. Stop when you find an occupied block
            for (int distanceX = 1; distanceX <= maxDistanceX; distanceX++) 
            {
                int passBlockX = blockX ${passDirection < 0 ? '-' : '+'} distanceX;
                if (passBlockX >= 0 && passBlockX < ${inWidth}) 
                {
                    float passOccupied = getA(blockZ, blockY, passBlockX, 0);
                    if (passOccupied > 0.0)
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

class ExtendedDistancePassY implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], passDirection: number, maxDistance: number = 31) 
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
            if (blockOccupied > 0.0) 
            {
                setOutput(0.0);
                return;
            }

            // If there is no hit with occupied block set maximum distance
            float blockDistance = ${maxDistance}.0;

            // Compute max distance in y dimension
            const int maxDistanceY = ${Math.min(maxDistance, inHeight - 1)};

            // Zig-zag along y dimension. Stop when you find an occupied block
            for (int distanceY = 1; distanceY <= maxDistanceY; distanceY++) 
            {
                int passBlockY = blockY ${passDirection < 0 ? '-' : '+'} distanceY;
                if (passBlockY >= 0 && passBlockY < ${inHeight}) 
                {
                    float passOccupied = getA(blockZ, passBlockY, blockX, 0);
                    if (passOccupied > 0.0)
                    {
                        blockDistance = float(distanceY);
                        break;
                    }
                }
            }

            setOutput(blockDistance);
        }
        `
    }
}

class ExtendedDistancePassZ implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], passDirection: number, maxDistance: number = 31) 
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
            if (blockOccupied > 0.0) 
            {
                setOutput(0.0);
                return;
            }

            // If there is no hit with occupied block set maximum distance
            float blockDistance = ${maxDistance}.0;

            // Compute max distance in z dimension
            const int maxDistanceZ = ${Math.min(maxDistance, inDepth - 1)};

            // Zig-zag along z dimension. Stop when you find an occupied block
            for (int distanceZ = 1; distanceZ <= maxDistanceZ; distanceZ++) 
            {
                int passBlockZ = blockZ ${passDirection < 0 ? '-' : '+'} distanceZ;
                if (passBlockZ >= 0 && passBlockZ < ${inDepth}) 
                {
                    float passOccupied = getA(passBlockZ, blockY, blockX, 0);
                    if (passOccupied > 0.0)
                    {
                        blockDistance = float(distanceZ);
                        break;
                    }
                }
            }

            setOutput(blockDistance);
        }
        `
    }
}

class ExtendedDistancePassXYZ implements GPGPUProgram 
{
    variableNames = ['A', 'B', 'C']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], passDirections: [number, number, number], maxDistance: number = 31) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

        bool inBounds(int blockX, int blockY, int blockZ)
        {
            return blockX >= 0 && blockX < ${inWidth}  && 
                   blockY >= 0 && blockY < ${inHeight} && 
                   blockZ >= 0 && blockZ < ${inDepth};
        }

        int bitpack(int distanceX, int distanceY, int distanceZ)
        {
            distanceX = clamp(distanceX, 0, 31);
            distanceY = clamp(distanceY, 0, 31);
            distanceZ = clamp(distanceZ, 0, 31);

            int distance = min(distanceX, min(distanceY, distanceZ));
            int occupancy = (distance == 0) ? 1 : 0;

            ivec4 v = ivec4(distanceX, distanceY, distanceZ, occupancy) 
                    * ivec4(2048, 64, 2, 1);

            return v.r + v.g + v.b + v.a;
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            int blockZ = outputCoords[0];
            int blockY = outputCoords[1];
            int blockX = outputCoords[2];

            const int maxDistanceX = ${Math.min(maxDistance, inWidth  - 1)};
            const int maxDistanceY = ${Math.min(maxDistance, inHeight - 1)};
            const int maxDistanceZ = ${Math.min(maxDistance, inDepth  - 1)};

            int blockDistanceX = int(getA(blockZ, blockY, blockX, 0));
            int blockDistanceY = int(getB(blockZ, blockY, blockX, 0));
            int blockDistanceZ = int(getC(blockZ, blockY, blockX, 0));

            for (int distanceX = 1; distanceX <= maxDistanceX; distanceX++) {
            for (int distanceY = 1; distanceY <= maxDistanceY; distanceY++) {

                int distanceZ = max(distanceX, distanceY);

                int passBlockX = blockX ${passDirections[0] < 0 ? '-' : '+'} distanceX;
                int passBlockY = blockY ${passDirections[1] < 0 ? '-' : '+'} distanceY;
                int passBlockZ = blockZ ${passDirections[2] < 0 ? '-' : '+'} distanceZ;
                
                if (inBounds(passBlockX, passBlockY, passBlockZ))
                {
                    int passDistanceX = int(getA(passBlockZ, passBlockY, passBlockX, 0));
                    int passDistanceY = int(getB(passBlockZ, passBlockY, passBlockX, 0)); 

                    blockDistanceX = min(blockDistanceX, passDistanceX);
                    blockDistanceY = min(blockDistanceY, passDistanceY);
                }
            }}

            for (int distanceY = 1; distanceY <= maxDistanceY; distanceY++) {
            for (int distanceZ = 1; distanceZ <= maxDistanceZ; distanceZ++) {

                int distanceX = max(distanceY, distanceZ);
                
                int passBlockX = blockX ${passDirections[0] < 0 ? '-' : '+'} distanceX;
                int passBlockY = blockY ${passDirections[1] < 0 ? '-' : '+'} distanceY;
                int passBlockZ = blockZ ${passDirections[2] < 0 ? '-' : '+'} distanceZ;
                
                if (inBounds(passBlockX, passBlockY, passBlockZ))
                {
                    int passDistanceY = int(getB(passBlockZ, passBlockY, passBlockX, 0));
                    int passDistanceZ = int(getC(passBlockZ, passBlockY, passBlockX, 0)); 

                    blockDistanceY = min(blockDistanceY, passDistanceY);
                    blockDistanceZ = min(blockDistanceZ, passDistanceZ);
                }
            }}
            
            for (int distanceX = 1; distanceX <= maxDistanceX; distanceX++) {
            for (int distanceZ = 1; distanceZ <= maxDistanceZ; distanceZ++) {
            
                int distanceY = max(distanceX, distanceZ);

                int passBlockX = blockX ${passDirections[0] < 0 ? '-' : '+'} distanceX;
                int passBlockY = blockY ${passDirections[1] < 0 ? '-' : '+'} distanceY;
                int passBlockZ = blockZ ${passDirections[2] < 0 ? '-' : '+'} distanceZ;

                if (inBounds(passBlockX, passBlockY, passBlockZ))
                {
                    int passDistanceX = int(getA(passBlockZ, passBlockY, passBlockX, 0));
                    int passDistanceZ = int(getC(passBlockZ, passBlockY, passBlockX, 0)); 

                    blockDistanceX = min(blockDistanceX, passDistanceX);
                    blockDistanceZ = min(blockDistanceZ, passDistanceZ);
                }
            }}

            // Pack into int16 5-5-5-1 format
            int packedDistances = bitpack(blockDistanceX, blockDistanceY, blockDistanceZ);

            setOutput(float(packedDistances));
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

        // 1D passes
        const passX0 = new ExtendedDistancePassX(shape, -1, maxDistance)
        const passX1 = new ExtendedDistancePassX(shape, +1, maxDistance)
        const passY0 = new ExtendedDistancePassY(shape, -1, maxDistance)
        const passY1 = new ExtendedDistancePassY(shape, +1, maxDistance)
        const passZ0 = new ExtendedDistancePassZ(shape, -1, maxDistance)
        const passZ1 = new ExtendedDistancePassZ(shape, +1, maxDistance)
        
        // 3D passes
        const passX0Y0Z0 = new ExtendedDistancePassXYZ(shape, [-1, -1, -1], maxDistance)
        const passX0Y0Z1 = new ExtendedDistancePassXYZ(shape, [-1, -1, +1], maxDistance)
        const passX0Y1Z0 = new ExtendedDistancePassXYZ(shape, [-1, +1, -1], maxDistance)
        const passX0Y1Z1 = new ExtendedDistancePassXYZ(shape, [-1, +1, +1], maxDistance)
        const passX1Y0Z0 = new ExtendedDistancePassXYZ(shape, [+1, -1, -1], maxDistance)
        const passX1Y0Z1 = new ExtendedDistancePassXYZ(shape, [+1, -1, +1], maxDistance)
        const passX1Y1Z0 = new ExtendedDistancePassXYZ(shape, [+1, +1, -1], maxDistance)
        const passX1Y1Z1 = new ExtendedDistancePassXYZ(shape, [+1, +1, +1], maxDistance)

        // 1D pass tensors
        const tensorX0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX0, [inputTensor])) as tf.Tensor4D
        const tensorX1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX1, [inputTensor])) as tf.Tensor4D
        const tensorY0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passY0, [inputTensor])) as tf.Tensor4D
        const tensorY1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passY1, [inputTensor])) as tf.Tensor4D
        const tensorZ0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ0, [inputTensor])) as tf.Tensor4D
        const tensorZ1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passZ1, [inputTensor])) as tf.Tensor4D

        // 3D pass tensors
        const tensorX0Y0Z0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX0Y0Z0, [tensorX0, tensorY0, tensorZ0])) as tf.Tensor4D
        const tensorX0Y0Z1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX0Y0Z1, [tensorX0, tensorY0, tensorZ1])) as tf.Tensor4D
        const tensorX0Y1Z0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX0Y1Z0, [tensorX0, tensorY1, tensorZ0])) as tf.Tensor4D
        const tensorX0Y1Z1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX0Y1Z1, [tensorX0, tensorY1, tensorZ1])) as tf.Tensor4D
        const tensorX1Y0Z0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX1Y0Z0, [tensorX1, tensorY0, tensorZ0])) as tf.Tensor4D
        const tensorX1Y0Z1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX1Y0Z1, [tensorX1, tensorY0, tensorZ1])) as tf.Tensor4D
        const tensorX1Y1Z0 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX1Y1Z0, [tensorX1, tensorY1, tensorZ0])) as tf.Tensor4D
        const tensorX1Y1Z1 = tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(passX1Y1Z1, [tensorX1, tensorY1, tensorZ1])) as tf.Tensor4D
        
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