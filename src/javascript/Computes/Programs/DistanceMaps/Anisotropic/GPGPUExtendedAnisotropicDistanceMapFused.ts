import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'
import { packUnsignedShort5551 } from '../../Encoding/GPGPUToUnsignedShort5551'

/** Seed occupied blocks with zero and scan along signed X from occupancy. The selected signs live in the batch dimension. */
class FirstExtendedAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputOccupancy']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        const maxSteps = Math.min(maxDistance, inWidth-1)
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `
        bool getInputOccupancy(ivec3 coords) 
        {
            return (getInputOccupancy(coords.z, coords.y, coords.x) > 0.5); 
        }

        ivec3 getInputCoordsFromOutputCoords(ivec4 coords) 
        { 
            return ivec3(coords.xyz); 
        }

        int getSignFromOutputCoords(ivec4 coords) 
        { 
            return (coords.w < 1) ? -1 : 1; 
        }

        bool outsideWidth(ivec3 coords)
        {
            return (coords.x < 0) || (coords.x > ${inWidth-1});
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = getInputCoordsFromOutputCoords(outputCoords);

            bool inputOccupied = getInputOccupancy(inputCoords);
            int outputDistance = ${maxDistance};

            int xSign = getSignFromOutputCoords(outputCoords);

            if (inputOccupied)
            {
                setOutput(0.0);
                return;
            }

            for (int xStep = 1; xStep <= ${maxSteps}; xStep++) 
            {
                inputCoords.x = outputCoords.x + xStep * xSign;
                if (outsideWidth(inputCoords))
                {
                    break;
                }

                inputOccupied = getInputOccupancy(inputCoords);
                if (inputOccupied)
                {
                    outputDistance = xStep;
                    break;
                }
            }

            setOutput(float(outputDistance));
        }
        `
    }
}

/** Build the signed Y seed for the YZ plane. The X seed serves both XY and XZ. */
class FirstExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputOccupancy']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        const maxSteps = Math.min(maxDistance, inWidth-1)
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `
        bool getInputOccupancy(ivec3 coords) 
        {
            return (getInputOccupancy(coords.z, coords.y, coords.x) > 0.5); 
        }

        ivec3 getInputCoordsFromOutputCoords(ivec4 coords) 
        { 
            return ivec3(coords.xyz); 
        }

        int getSignFromOutputCoords(ivec4 coords) 
        { 
            return (coords.w < 1) ? -1 : 1; 
        }

        bool outsideHeight(ivec3 coords)
        {
            return (coords.y < 0) || (coords.y > ${inHeight-1});
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = getInputCoordsFromOutputCoords(outputCoords);

            bool inputOccupied = getInputOccupancy(inputCoords);
            int outputDistance = ${maxDistance};

            int ySign = getSignFromOutputCoords(outputCoords);

            if (inputOccupied)
            {
                setOutput(0.0);
                return;
            }

            for (int yStep = 1; yStep <= ${maxSteps}; yStep++) 
            {
                inputCoords.y = outputCoords.y + yStep * ySign;
                if (outsideHeight(inputCoords))
                {
                    break;
                }

                inputOccupied = getInputOccupancy(inputCoords);
                if (inputOccupied)
                {
                    outputDistance = yStep;
                    break;
                }
            }

            setOutput(float(outputDistance));
        }
        `
    }
}

/** Build signed XY distances from signed X. The batch is xSign + 2*ySign. */
class SecondExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputDistance']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape
        if (inBatch != 2) throw new Error('Batch dimension needs to be 2');
        const maxSteps = Math.min(maxDistance, inHeight-1)
        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `
        int getInputDistance(ivec4 coords) 
        { 
            return int(getInputDistance(coords.w, coords.z, coords.y, coords.x)); 
        }

        ivec4 getInputCoordsFromOutputCoords(ivec4 coords) 
        { 
            return ivec4(coords.xyz, coords.w % 2); 
        }

        int getSignFromOutputCoords(ivec4 coords) 
        { 
            return (coords.w < 2) ? -1 : 1; 
        }

        bool outsideHeight(ivec4 coords)
        {
            return (coords.y < 0) || (coords.y > ${inHeight-1});
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);
            
            int inputDistance = getInputDistance(inputCoords);
            int outputDistance = inputDistance;
            int candidateDistance;

            int ySign = getSignFromOutputCoords(outputCoords);

            if (outputDistance <= 1)
            {
                setOutput(float(outputDistance));
                return;
            }

            for (int yStep = 1; yStep <= ${maxSteps}; yStep++) 
            {
                inputCoords.y = outputCoords.y + yStep * ySign;
                if (outsideHeight(inputCoords))
                {
                    break;
                }

                inputDistance = getInputDistance(inputCoords);
                candidateDistance = max(inputDistance, yStep);

                outputDistance = min(outputDistance, candidateDistance);
                if (outputDistance <= yStep)
                {
                    break;
                }
            }

            setOutput(float(outputDistance));
        }
        `
    }
}

/** Add signed Z to an X or Y distance field. The prior sign uses bit 0 and the Z sign uses bit 1. */
class SecondExtendedAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputDistance']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape
        if (inBatch != 2) throw new Error('Batch dimension needs to be 2');
        const maxSteps = Math.min(maxDistance, inDepth-1)
        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `
        int getInputDistance(ivec4 coords) 
        { 
            return int(getInputDistance(coords.w, coords.z, coords.y, coords.x)); 
        }

        ivec4 getInputCoordsFromOutputCoords(ivec4 coords) 
        { 
            return ivec4(coords.xyz, coords.w % 2); 
        }

        int getSignFromOutputCoords(ivec4 coords) 
        { 
            return (coords.w < 2) ? -1 : 1; 
        }

        bool outsideDepth(ivec4 coords)
        {
            return (coords.z < 0) || (coords.z > ${inDepth-1});
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);
            
            int inputDistance = getInputDistance(inputCoords);
            int outputDistance = inputDistance;
            int candidateDistance;

            int zSign = getSignFromOutputCoords(outputCoords);

            if (outputDistance <= 1)
            {
                setOutput(float(outputDistance));
                return;
            }

            for (int zStep = 1; zStep <= ${maxSteps}; zStep++) 
            {
                inputCoords.z = outputCoords.z + zStep * zSign;
                if (outsideDepth(inputCoords))
                {
                    break;
                }

                inputDistance = getInputDistance(inputCoords);
                candidateDistance = max(inputDistance, zStep);

                outputDistance = min(outputDistance, candidateDistance);
                if (outputDistance <= zStep)
                {
                    break;
                }
            }

            setOutput(float(outputDistance));
        }
        `
    }
}

/** Scan signed X for its first dominating YZ candidate. The input YZ batch is the output octant shifted right by one bit. */
class ThirdExtendedAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputDistance']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape
        if (inBatch != 4) throw new Error('Batch dimension needs to be 4');
        const maxSteps = Math.min(maxDistance, inWidth-1)
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        int getInputDistance(ivec4 coords) 
        { 
            return int(getInputDistance(coords.w, coords.z, coords.y, coords.x)); 
        }

        ivec4 getInputCoordsFromOutputCoords(ivec4 coords) 
        { 
            return ivec4(coords.xyz, coords.w / 2); 
        }

        int getSignFromOutputCoords(ivec4 coords) 
        { 
            return ((coords.w % 2) == 0) ? -1 : 1; 
        }

        bool outsideWidth(ivec4 coords)
        {
            return (coords.x < 0) || (coords.x > ${inWidth-1});
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);
            
            int inputDistance = getInputDistance(inputCoords);
            int outputDistance = ${maxDistance};

            int xSign = getSignFromOutputCoords(outputCoords);

            if (inputDistance == 0)
            {
                setOutput(0.0);
                return;
            }

            for (int xStep = 1; xStep <= ${maxSteps}; xStep++) 
            {
                inputCoords.x = outputCoords.x + xStep * xSign;
                if (outsideWidth(inputCoords))
                {
                    break;
                }

                inputDistance = getInputDistance(inputCoords);
                // This slice can contain an occupied block whose orthogonal offsets fit inside xStep.
                if (inputDistance <= xStep)
                {
                    outputDistance = xStep;
                    break;
                }
            }

            setOutput(float(outputDistance));
        }
        `
    }
}

/** Scan signed Y for its first dominating XZ candidate. Remove the Y bit to find the input XZ batch. */
class ThirdExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputDistance']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape
        if (inBatch != 4) throw new Error('Batch dimension needs to be 4');
        const maxSteps = Math.min(maxDistance, inHeight-1)
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        int getInputDistance(ivec4 coords) 
        { 
            return int(getInputDistance(coords.w, coords.z, coords.y, coords.x)); 
        }

        ivec4 getInputCoordsFromOutputCoords(ivec4 coords) 
        { 
            return ivec4(coords.xyz, (coords.w % 2) + 2 * (coords.w / 4)); 
        }

        int getSignFromOutputCoords(ivec4 coords) 
        { 
            return ((coords.w % 4) / 2) == 0 ? -1 : 1;
        }

        bool outsideHeight(ivec4 coords)
        {
            return (coords.y < 0) || (coords.y > ${inHeight-1});
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);
            
            int inputDistance = getInputDistance(inputCoords);
            int outputDistance = ${maxDistance};

            int ySign = getSignFromOutputCoords(outputCoords);

            if (inputDistance == 0)
            {
                setOutput(0.0);
                return;
            }

            for (int yStep = 1; yStep <= ${maxSteps}; yStep++) 
            {
                inputCoords.y = outputCoords.y + yStep * ySign;
                if (outsideHeight(inputCoords))
                {
                    break;
                }

                inputDistance = getInputDistance(inputCoords);
                if (inputDistance <= yStep)
                {
                    outputDistance = yStep;
                    break;
                }
            }

            setOutput(float(outputDistance));
        }
        `
    }
}

/** Scan signed Z for its first dominating XY candidate. The two low octant bits identify the XY input batch. */
class ThirdExtendedAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputDistance']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape
        if (inBatch != 4) throw new Error('Batch dimension needs to be 4');
        const maxSteps = Math.min(maxDistance, inDepth-1)
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        int getInputDistance(ivec4 coords) 
        { 
            return int(getInputDistance(coords.w, coords.z, coords.y, coords.x)); 
        }

        ivec4 getInputCoordsFromOutputCoords(ivec4 coords) 
        { 
            return ivec4(coords.xyz, coords.w % 4); 
        }

        int getSignFromOutputCoords(ivec4 coords) 
        { 
            return ((coords.w % 8) < 4) ? -1 : 1;
        }

        bool outsideDepth(ivec4 coords)
        {
            return (coords.z < 0) || (coords.z > ${inDepth-1});
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);
            
            int inputDistance = getInputDistance(inputCoords);
            int outputDistance = ${maxDistance};

            int zSign = getSignFromOutputCoords(outputCoords);

            if (inputDistance == 0)
            {
                setOutput(0.0);
                return;
            }

            for (int zStep = 1; zStep <= ${maxSteps}; zStep++) 
            {
                inputCoords.z = outputCoords.z + zStep * zSign;
                if (outsideDepth(inputCoords))
                {
                    break;
                }

                inputDistance = getInputDistance(inputCoords);
                if (inputDistance <= zStep)
                {
                    outputDistance = zStep;
                    break;
                }
            }

            setOutput(float(outputDistance));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor 
{
    const backend = tf.backend() as MathBackendWebGL
    return tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(prog, inputs))
}

/**
 * Build axis extents that bound an empty box in block coordinates. Scalar samples are batched by sign combination so each planar or final-axis transform shares a dispatch.
 *
 * The final scan along one axis accepts an offset k when the orthogonal plane distance is <= k. This includes equal largest offsets.
 *
 * @param inputOccupancy - Binary [z,y,x] occupancy grid.
 * @param maxDistance - Integer extent cap from 1 through 31.
 * @returns [octant,z,y,x], with X, Y, and Z sign bits from low to high and positive encoded as 1. Each entry is a numeric 5-5-5-1 word containing XYZ extents and occupancy. Octant grids are consecutive along Z in the viewer texture.
 */
export function computeExtendedAnisotropicDistanceMap(inputOccupancy: tf.Tensor3D, maxDistance: number): tf.Tensor4D 
{
    // 1D 
    const firstPassX = new FirstExtendedAnisotropicChebyshevDistancePassX(inputOccupancy.shape, maxDistance)
    const firstPassY = new FirstExtendedAnisotropicChebyshevDistancePassY(inputOccupancy.shape, maxDistance)
    const distance_X0_X1 = runProgram(firstPassX, [inputOccupancy]) as tf.Tensor4D
    const distance_Y0_Y1 = runProgram(firstPassY, [inputOccupancy]) as tf.Tensor4D

    // 2D
    const secondPassY = new SecondExtendedAnisotropicChebyshevDistancePassY(distance_X0_X1.shape, maxDistance)
    const distance_XY00_XY10_XY01_XY11 = runProgram(secondPassY, [distance_X0_X1]) as tf.Tensor4D; 
    
    const secondPassZ = new SecondExtendedAnisotropicChebyshevDistancePassZ(distance_Y0_Y1.shape, maxDistance)
    const distance_XZ00_XZ10_XZ01_XZ11 = runProgram(secondPassZ, [distance_X0_X1]) as tf.Tensor4D
    tf.dispose(distance_X0_X1)
    
    const distance_YZ00_YZ10_YZ01_YZ11 = runProgram(secondPassZ, [distance_Y0_Y1]) as tf.Tensor4D
    tf.dispose(distance_Y0_Y1)

    // 3D
    const thirdPassX = new ThirdExtendedAnisotropicChebyshevDistancePassX(distance_YZ00_YZ10_YZ01_YZ11.shape, maxDistance)
    const distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassX, [distance_YZ00_YZ10_YZ01_YZ11]) as tf.Tensor4D
    tf.dispose(distance_YZ00_YZ10_YZ01_YZ11)

    const thirdPassY = new ThirdExtendedAnisotropicChebyshevDistancePassY(distance_XZ00_XZ10_XZ01_XZ11.shape, maxDistance)
    const distanceY_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassY, [distance_XZ00_XZ10_XZ01_XZ11]) as tf.Tensor4D 
    tf.dispose(distance_XZ00_XZ10_XZ01_XZ11)
    
    const thirdPassZ = new ThirdExtendedAnisotropicChebyshevDistancePassZ(distance_XY00_XY10_XY01_XY11.shape, maxDistance)
    const distanceZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassZ, [distance_XY00_XY10_XY01_XY11]) as tf.Tensor4D
    tf.dispose(distance_XY00_XY10_XY01_XY11)

    // Pack
    // The three eight-octant extent tensors stay live together for the final assembly.
    const distancesXYZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = packUnsignedShort5551(
        distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceY_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        inputOccupancy
    ) 
    tf.dispose([
        distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceY_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
    ])

    return distancesXYZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 as tf.Tensor4D
}
