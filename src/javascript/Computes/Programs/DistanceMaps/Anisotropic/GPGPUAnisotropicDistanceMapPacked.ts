import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Scan packed XY tiles along X from zero occupied seeds and capped empty seeds. The selected sign is specialized into the GLSL. */
class FirstAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputOccupancies']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        inputSign: '-' | '+',
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2
        const maxSteps = ceilToEven(Math.min(maxDistance, inWidth - 1))
        this.outputShape = [inDepth, inHeight, inWidth]
        this.userCode = `        
        ivec4 getDistancesFromOccupancies(vec4 occupancies)
        {
            return ivec4(lessThan(occupancies, vec4(0.5))) * ${maxDistance};
        }

        ivec4 getInputDistances(ivec3 coords)
        {
            return getDistancesFromOccupancies(getInputOccupancies(coords.z, coords.y, coords.x));
        }

        bool outsideWidth(ivec3 coords)
        {
            return (coords.x < 0) || (coords.x > ${inWidth-1});
        }

        int mmax(ivec4 distances) 
        { 
            return max(max(distances.x, distances.y), max(distances.z, distances.w)); 
        }

        const int xSign = ${inputSign} 1;

        void main() 
        {
            ivec3 outputCoords = getOutputCoords().zyx;
            ivec3 inputCoords = outputCoords;

            ivec4 inputDistances = getInputDistances(inputCoords);
            ivec4 outputDistances = inputDistances;
            ivec4 neighborDistances, candidateDistances, xSteps;

            ${inputSign == '-' ? 
            `
                xSteps.rb = ivec2(0 - xSign);
                xSteps.ga = ivec2(0);

                neighborDistances = max(inputDistances, xSteps);
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                candidateDistances.rb = neighborDistances.rb;

            `:`
                xSteps.rb = ivec2(0);
                xSteps.ga = ivec2(0 + xSign);

                neighborDistances = max(inputDistances, xSteps);
                candidateDistances.ga = neighborDistances.ga;
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
            `}

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) <= 1) 
            {
                setOutput(vec4(outputDistances));
                return;
            }
            
            // Process two X offsets per step. The RG and BA lane pairs must use offsets relative to their individual output coordinates.
            for (int xStep = 2; xStep <= ${maxSteps}; xStep += 2) 
            {
                inputCoords.x = outputCoords.x + xStep * xSign;
                if (outsideWidth(inputCoords)) 
                {
                    break;                    
                }

                inputDistances = getInputDistances(inputCoords);

                xSteps.rb = ivec2(xStep - xSign);
                xSteps.ga = ivec2(xStep);

                neighborDistances = max(inputDistances, xSteps);
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga); 

                xSteps.rb = ivec2(xStep);
                xSteps.ga = ivec2(xStep + xSign);

                neighborDistances = max(inputDistances, xSteps);
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                outputDistances = min(outputDistances, candidateDistances);
                if (mmax(outputDistances) <= xStep + 1) 
                {
                    break;
                }
            }

            outputDistances = clamp(outputDistances, ivec4(0), ivec4(${maxDistance}));
            setOutput(vec4(outputDistances));
        }
        `
    }
}

/**
 * Extend the X transform into an XY Chebyshev distance.
 *
 * For offset k along Y, take min over candidates max(Dx(p + k*ey), |k|).
 */
class SecondAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        inputSign: '-' | '+',
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape; 
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2
        const maxSteps = ceilToEven(Math.min(maxDistance, inHeight - 1))
        this.outputShape = [inDepth, inHeight, inWidth]
        this.userCode = `        
        ivec4 getInputDistances(ivec3 coords) 
        { 
            return ivec4(getInputDistances(coords.z, coords.y, coords.x)); 
        }

        bool outsideHeight(ivec3 coords)
        {
            return (coords.y < 0) || (coords.y > ${inHeight-1});
        }

        int mmax(ivec4 distances) 
        { 
            return max(max(distances.x, distances.y), max(distances.z, distances.w)); 
        }

        const int ySign = ${inputSign} 1;

        void main() 
        {
            ivec3 outputCoords = getOutputCoords().zyx;
            ivec3 inputCoords = outputCoords;    

            ivec4 inputDistances = getInputDistances(inputCoords);
            ivec4 outputDistances = inputDistances;
            ivec4 neighborDistances, candidateDistances, ySteps;

            ${inputSign == '-' ? 
            `   
                ySteps.rg = ivec2(0 - ySign);
                ySteps.ba = ivec2(0);

                neighborDistances = max(inputDistances, ySteps);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            `:`
                ySteps.rg = ivec2(0);
                ySteps.ba = ivec2(0 + ySign);

                neighborDistances = max(inputDistances, ySteps);
                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            `}

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) <= 1) 
            {
                setOutput(vec4(outputDistances));
                return;
            }

            for (int yStep = 2; yStep <= ${maxSteps}; yStep += 2) 
            {
                inputCoords.y = outputCoords.y + yStep * ySign;
                if (outsideHeight(inputCoords)) 
                {
                    break;   
                }
                
                inputDistances = getInputDistances(inputCoords);

                ySteps.rg = ivec2(yStep - ySign);
                ySteps.ba = ivec2(yStep);

                neighborDistances = max(inputDistances, ySteps);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                ySteps.rg = ivec2(yStep);
                ySteps.ba = ivec2(yStep + ySign);

                neighborDistances = max(inputDistances, ySteps);
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
                
                outputDistances = min(outputDistances, candidateDistances);
                if (mmax(outputDistances) <= yStep + 1) 
                {
                    break;
                }
            }

            outputDistances = clamp(outputDistances, ivec4(0), ivec4(${maxDistance}));
            setOutput(vec4(outputDistances));
        }
        `
    }
}

/** Combine XY bounds across Z to complete the 3D transform. Z advances between tiles without rearranging the XY lanes. */
class ThirdAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        inputSign: '-' | '+',
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        const maxSteps = Math.min(maxDistance, inDepth - 1)
        this.outputShape = [inDepth, inHeight, inWidth]
        this.userCode = `
        ivec4 getInputDistances(ivec3 coords) 
        { 
            return ivec4(getInputDistances(coords.z, coords.y, coords.x)); 
        }

        bool outsideDepth(ivec3 coords)
        {
            return (coords.z < 0) || (coords.z > ${inDepth-1});
        }

        int mmax(ivec4 distances) 
        { 
            return max(max(distances.x, distances.y), max(distances.z, distances.w)); 
        }

        const int zSign = ${inputSign} 1;

        void main() 
        {
            ivec3 outputCoords = getOutputCoords().zyx;
            ivec3 inputCoords = outputCoords;

            ivec4 inputDistances = getInputDistances(inputCoords);
            ivec4 outputDistances = inputDistances;
            ivec4 candidateDistances;

            if (mmax(outputDistances) <= 1) 
            {
                setOutput(vec4(outputDistances));
                return;
            }

            for (int zStep = 1; zStep <= ${maxSteps}; zStep++) 
            {
                inputCoords.z = outputCoords.z + zStep * zSign;
                if (outsideDepth(inputCoords))
                {
                    break;
                }

                inputDistances = getInputDistances(inputCoords);
                candidateDistances = max(inputDistances, zStep);

                outputDistances = min(outputDistances, candidateDistances); 
                if (mmax(outputDistances) <= zStep + 1) 
                {
                    break;
                }
            }

            outputDistances = clamp(outputDistances, ivec4(0), ivec4(${maxDistance}));
            setOutput(vec4(outputDistances));
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
 * Build capped signed-octant Chebyshev distances in block units. The legacy packed baseline dispatches a separate transform per sign combination, then stacks the eight grids.
 *
 * @param inputOccupancy - Binary [z,y,x] occupancy grid. Occupied blocks seed zero.
 * @param maxDistance - Integer search and output cap. A block without a closer hit keeps the cap.
 * @returns A new [octant,z,y,x] tensor, with octant = xSign + 2*ySign + 4*zSign and 1 for a positive sign.
 */
export function computeAnisotropicDistanceMap(inputOccupancy: tf.Tensor3D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    // 1D 
    const firstPassX0 = new FirstAnisotropicChebyshevDistancePassX(shape, '-', maxDistance)
    const firstPassX1 = new FirstAnisotropicChebyshevDistancePassX(shape, '+', maxDistance)
    const distanceX0 = runProgram(firstPassX0, [inputOccupancy])
    const distanceX1 = runProgram(firstPassX1, [inputOccupancy])

    // 2D
    const secondPassY0 = new SecondAnisotropicChebyshevDistancePassY(shape, '-', maxDistance)
    const secondPassY1 = new SecondAnisotropicChebyshevDistancePassY(shape, '+', maxDistance)
    const distanceXY00 = runProgram(secondPassY0, [distanceX0]);
    const distanceXY01 = runProgram(secondPassY1, [distanceX0])
    tf.dispose(distanceX0)

    const distanceXY10 = runProgram(secondPassY0, [distanceX1]);
    const distanceXY11 = runProgram(secondPassY1, [distanceX1])
    tf.dispose(distanceX1)

    // 3D
    const thirdPassZ0 = new ThirdAnisotropicChebyshevDistancePassZ(shape, '-', maxDistance)
    const thirdPassZ1 = new ThirdAnisotropicChebyshevDistancePassZ(shape, '+', maxDistance)
    const distanceXYZ000 = runProgram(thirdPassZ0, [distanceXY00]);
    const distanceXYZ001 = runProgram(thirdPassZ1, [distanceXY00])
    tf.dispose(distanceXY00)

    const distanceXYZ010 = runProgram(thirdPassZ0, [distanceXY01]);
    const distanceXYZ011 = runProgram(thirdPassZ1, [distanceXY01])
    tf.dispose(distanceXY01)

    const distanceXYZ100 = runProgram(thirdPassZ0, [distanceXY10]);
    const distanceXYZ101 = runProgram(thirdPassZ1, [distanceXY10])
    tf.dispose(distanceXY10)

    const distanceXYZ110 = runProgram(thirdPassZ0, [distanceXY11]);
    const distanceXYZ111 = runProgram(thirdPassZ1, [distanceXY11])
    tf.dispose(distanceXY11)
    
    // Stack packed grids in the renderer's XYZ sign-bit order.
    const distance_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = tf.stack([
        distanceXYZ000,
        distanceXYZ100,
        distanceXYZ010,
        distanceXYZ110,
        distanceXYZ001,
        distanceXYZ101,
        distanceXYZ011,
        distanceXYZ111,
    ], 0)

    tf.dispose([
        distanceXYZ000,
        distanceXYZ100,
        distanceXYZ010,
        distanceXYZ110,
        distanceXYZ001,
        distanceXYZ101,
        distanceXYZ011,
        distanceXYZ111,
    ])

    return distance_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 as tf.Tensor4D
}
