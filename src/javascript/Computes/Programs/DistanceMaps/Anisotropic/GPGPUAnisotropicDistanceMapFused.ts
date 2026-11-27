import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Scan scalar blocks along X from zero occupied seeds and capped empty seeds. The two X directions share the leading output batch. */
class FirstAnisotropicChebyshevDistancePassX implements GPGPUProgram 
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

/**
 * Extend each X sign batch along either Y direction. The output batch index is xSign + 2*ySign.
 *
 * For offset k along Y, take min over candidates max(Dx(p + k*ey), |k|).
 */
class SecondAnisotropicChebyshevDistancePassY implements GPGPUProgram 
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

/** Extend each XY sign batch along Z. The high bit in the output batch selects the Z direction. */
class ThirdAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
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
            return (coords.w < 4) ? -1 : 1; 
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

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor 
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor
}

/**
 * Build capped signed-octant Chebyshev distances in block units. The three fused passes expand the sign batch from two to four to eight, avoiding a final stack.
 *
 * @param inputOccupancy - Binary [z,y,x] occupancy grid. Occupied blocks seed zero.
 * @param maxDistance - Integer search and output cap. A block without a closer hit keeps the cap.
 * @returns A new [octant,z,y,x] tensor, with octant = xSign + 2*ySign + 4*zSign and 1 for a positive sign. The viewer stores the octant grids consecutively along Z.
 */
export function computeAnisotropicDistanceMap(inputOccupancy: tf.Tensor3D, maxDistance: number) : tf.Tensor4D
{
    // 1D 
    const firstPassX = new FirstAnisotropicChebyshevDistancePassX(inputOccupancy.shape, maxDistance)
    const distance_X0_X1 = runProgram(firstPassX, [inputOccupancy]) as tf.Tensor4D

    // 2D
    const secondPassY = new SecondAnisotropicChebyshevDistancePassY(distance_X0_X1.shape,  maxDistance)
    const distance_XY00_XY10_XY01_XY11 = runProgram(secondPassY, [distance_X0_X1]) as tf.Tensor4D
    tf.dispose(distance_X0_X1)

    // 3D
    const thirdPassZ = new ThirdAnisotropicChebyshevDistancePassZ(distance_XY00_XY10_XY01_XY11.shape, maxDistance)
    const distance_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassZ, [distance_XY00_XY10_XY01_XY11]) as tf.Tensor4D
    tf.dispose(distance_XY00_XY10_XY01_XY11)


    return distance_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 
}
