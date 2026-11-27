import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'
import { packUnsignedShort5551 } from '../../Encoding/GPGPUToUnsignedShort5551Packed'

/**
 * The passes measure distance in occupancy-grid blocks. Inside a signed octant,
 * a partial Chebyshev pass adds an axis using D'(p) = min_k max(D(p + s*k), k),
 * where s is the signed unit vector along that axis and k is a nonnegative block offset.
 *
 * The final passes instead find the first k for which D(p + s*k) <= k. This
 * assigns each occupied block to any axis on which its offset is greatest,
 * including ties. From an empty block, offsets 0 through extent[i] - 1 on each
 * axis define an empty box in the ray octant. An occupied block inside that box
 * would contradict the extent along its greatest-offset axis. Capping extents
 * can only shorten the box. The skip guarantee depends on conservative occupancy.
 *
 * TensorFlow.js packs a spatial 2×2 XY tile into RGBA, with X in the R/G and B/A
 * pairs and Y in the R/B and G/A pairs. The leading sign dimension is a batch,
 * so fusing sign combinations into a pass preserves the spatial lane layout.
 */

/**
 * Seed distances from binary occupancy and scan along signed X.
 * The input is [z,y,x] and the output is [xSign,z,y,x], with 0 = − and 1 = +.
 */
class FirstExtendedAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputOccupancies']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        // Round the loop bound to a tile boundary. The output still uses the distance cap.
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2
        const maxSteps = ceilToEven(Math.min(maxDistance, inWidth-1))
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `        
        // Zero seeds occupied blocks. The distance cap also represents an empty seed.
        ivec4 getDistancesFromOccupancies(vec4 occupancies)
        {
            return ivec4(lessThan(occupancies, vec4(0.5))) * ${maxDistance};
        }

        ivec4 getInputDistances(ivec3 coords)
        {
            return getDistancesFromOccupancies(getInputOccupancies(coords.z, coords.y, coords.x));
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

        int mmax(ivec4 vec) 
        { 
            return max(max(vec.x, vec.y), max(vec.z, vec.w)); 
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = getInputCoordsFromOutputCoords(outputCoords);

            ivec4 inputDistances = getInputDistances(inputCoords);
            ivec4 outputDistances = inputDistances;
            ivec4 neighborDistances, candidateDistances, xSteps;

            int xSign = getSignFromOutputCoords(outputCoords);
            // The current tile contains a distance-one neighbor for only one lane in each X pair.
            if (xSign < 0)
            {
                xSteps.rb = ivec2(0 - xSign);
                xSteps.ga = ivec2(0);

                neighborDistances = max(inputDistances, xSteps);
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                candidateDistances.rb = neighborDistances.rb;
            }
            else
            {
                xSteps.rb = ivec2(0);
                xSteps.ga = ivec2(0 + xSign);

                neighborDistances = max(inputDistances, xSteps);
                candidateDistances.ga = neighborDistances.ga;
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
            }

            outputDistances = min(outputDistances, candidateDistances);
            // The longest lane controls the exit. Later offsets cannot lower any result.
            if (mmax(outputDistances) <= 1) 
            {
                setOutput(vec4(outputDistances));
                return;
            }
            
            // One fetch covers two X coordinates. Swizzles align offsets to each output lane.
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

            outputDistances = clamp(outputDistances, 0, ${maxDistance});
            setOutput(vec4(outputDistances));
        }
        `
    }
}

/**
 * Seed and scan signed Y from [z,y,x] occupancy to [ySign,z,y,x].
 * The two Y rows of each packed tile are the RG and BA lane groups.
 */
class FirstExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputOccupancies']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2
        const maxSteps = ceilToEven(Math.min(maxDistance, inHeight-1))
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `        
        ivec4 getDistancesFromOccupancies(vec4 occupancies)
        {
            return ivec4(lessThan(occupancies, vec4(0.5))) * ${maxDistance};
        }

        ivec4 getInputDistances(ivec3 coords)
        {
            return getDistancesFromOccupancies(getInputOccupancies(coords.z, coords.y, coords.x));
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

        int mmax(ivec4 vec) 
        { 
            return max(max(vec.x, vec.y), max(vec.z, vec.w)); 
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = getInputCoordsFromOutputCoords(outputCoords);

            ivec4 inputDistances = getInputDistances(inputCoords);
            ivec4 outputDistances = inputDistances;
            ivec4 neighborDistances, candidateDistances, ySteps;

            int ySign = getSignFromOutputCoords(outputCoords);
            if (ySign < 0)
            {
                ySteps.rg = ivec2(0 - ySign);
                ySteps.ba = ivec2(0);

                neighborDistances = max(inputDistances, ySteps);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            }
            else
            {
                ySteps.rg = ivec2(0);
                ySteps.ba = ivec2(0 + ySign);

                neighborDistances = max(inputDistances, ySteps);
                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            }

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

            outputDistances = clamp(outputDistances, 0, ${maxDistance});
            setOutput(vec4(outputDistances));
        }
        `
    }
}

/**
 * Extend the signed X distances along Y to produce planar XY distances.
 * The output batch is xSign + 2*ySign.
 */
class SecondExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatches, inDepth, inHeight, inWidth] = inputShape
        if (inBatches != 2) throw new Error('Batch dimension needs to be 2')
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2
        const maxSteps = ceilToEven(Math.min(maxDistance, inHeight-1))
        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `        
        ivec4 getInputDistances(ivec4 coords) 
        { 
            return ivec4(getInputDistances(coords.w, coords.z, coords.y, coords.x)); 
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

        int mmax(ivec4 vec) 
        { 
            return max(max(vec.x, vec.y), max(vec.z, vec.w)); 
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);    

            ivec4 inputDistances = getInputDistances(inputCoords);
            ivec4 outputDistances = inputDistances;
            ivec4 neighborDistances, candidateDistances, ySteps;

            int ySign = getSignFromOutputCoords(outputCoords);
            if (ySign < 0)
            {
                ySteps.rg = ivec2(0 - ySign);
                ySteps.ba = ivec2(0);

                neighborDistances = max(inputDistances, ySteps);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            }
            else
            {
                ySteps.rg = ivec2(0);
                ySteps.ba = ivec2(0 + ySign);

                neighborDistances = max(inputDistances, ySteps);
                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            }

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

            outputDistances = clamp(outputDistances, 0, ${maxDistance});
            setOutput(vec4(outputDistances));
        }
        `
    }
}

/**
 * Extend signed X or Y distances along Z to produce planar XZ or YZ distances.
 * The original sign stays in bit 0 and the Z sign occupies bit 1.
 */
class SecondExtendedAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatches, inDepth, inHeight, inWidth] = inputShape
        if (inBatches != 2) throw new Error('Batch dimension needs to be 2')
        const maxSteps = Math.min(maxDistance, inDepth-1)
        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `
        ivec4 getInputDistances(ivec4 coords) 
        { 
            return ivec4(getInputDistances(coords.w, coords.z, coords.y, coords.x)); 
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

        int mmax(ivec4 vec) 
        { 
            return max(max(vec.x, vec.y), max(vec.z, vec.w)); 
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);    

            ivec4 inputDistances = getInputDistances(inputCoords);
            ivec4 outputDistances = inputDistances;
            ivec4 candidateDistances;

            int zSign = getSignFromOutputCoords(outputCoords);

            if (mmax(outputDistances) <= 1)
            {
                setOutput(vec4(outputDistances));
                return;
            } 

            // An XY tile stays in the same four lanes at every Z coordinate.
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

            outputDistances = clamp(outputDistances, 0, ${maxDistance});
            setOutput(vec4(outputDistances));
        }
        `
    }
}

/**
 * Find the X extent from planar YZ distances for all eight octants.
 * Dividing the output batch by two drops the X bit and selects the input YZ plane.
 */
class ThirdExtendedAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {        
        const [inBatch, inDepth, inHeight, inWidth] = inputShape
        if (inBatch != 4) throw new Error('Batch dimension needs to be 4')
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2
        const maxSteps = ceilToEven(Math.min(maxDistance, inWidth-1))
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        ivec4 getInputDistances(ivec4 coords) 
        { 
            return ivec4(getInputDistances(coords.w, coords.z, coords.y, coords.x)); 
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
            return coords.x < 0 || coords.x > ${inWidth-1}; 
        }

        int mmax(ivec4 vec) 
        { 
            return max(max(vec.x, vec.y), max(vec.z, vec.w)); 
        }

        ivec4 mmix(ivec4 a, ivec4 b, bvec4 mask) 
        {
            return ivec4(mask) * (b - a) + a;
        }

        const ivec4 maxDistances = ivec4(${maxDistance});

        void main() 
        {            
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);

            ivec4 outputDistances = maxDistances;
            ivec4 inputDistances, neighborDistances, candidateDistances, xSteps;

            int xSign = getSignFromOutputCoords(outputCoords);
        
            for (int xStep = 0; xStep <= ${maxSteps}; xStep += 2) 
            {
                inputCoords.x = outputCoords.x + xStep * xSign;
                if (outsideWidth(inputCoords))
                {
                    break;
                }

                inputDistances = getInputDistances(inputCoords);

                xSteps.ga = ivec2(xStep);
                xSteps.rb = ivec2(xStep - xSign);

                // A YZ distance <= k makes X a greatest-offset axis at this candidate.
                // The inclusive test retains ties. Negative offsets fail against nonnegative distances.
                neighborDistances = mmix(maxDistances, xSteps, lessThanEqual(inputDistances, xSteps));
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);

                xSteps.ga = ivec2(xStep + xSign);
                xSteps.rb = ivec2(xStep);

                neighborDistances = mmix(maxDistances, xSteps, lessThanEqual(inputDistances, xSteps));
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                outputDistances = min(outputDistances, candidateDistances);
                if (mmax(outputDistances) <= xStep + 1) 
                {
                    break;
                }
            }

            outputDistances = clamp(outputDistances, 0, ${maxDistance});
            setOutput(vec4(outputDistances));
        }
        `
    }
}

/**
 * Find the Y extent from planar XZ distances for all eight octants.
 * Drop the middle Y bit to recover the two-bit XZ input batch index.
 */
class ThirdExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {        
        const [inBatch, inDepth, inHeight, inWidth] = inputShape
        if (inBatch != 4) throw new Error('Batch dimension needs to be 4')
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2
        const maxSteps = ceilToEven(Math.min(maxDistance, inHeight-1))
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        ivec4 getInputDistances(ivec4 coords) 
        { 
            return ivec4(getInputDistances(coords.w, coords.z, coords.y, coords.x)); 
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
            return coords.y < 0 || coords.y > ${inHeight-1}; 
        }
       
        int mmax(ivec4 vec) 
        { 
            return max(max(vec.x, vec.y), max(vec.z, vec.w)); 
        }

        ivec4 mmix(ivec4 a, ivec4 b, bvec4 mask) 
        {
            return ivec4(mask) * (b - a) + a;
        }

        const ivec4 maxDistances = ivec4(${maxDistance});

        void main() 
        {            
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);

            ivec4 outputDistances = maxDistances;
            ivec4 inputDistances, neighborDistances, candidateDistances, ySteps;

            int ySign = getSignFromOutputCoords(outputCoords);
        
            for (int yStep = 0; yStep <= ${maxSteps}; yStep += 2) 
            {
                inputCoords.y = outputCoords.y + yStep * ySign;
                if (outsideHeight(inputCoords))
                {
                    break;
                }

                inputDistances = getInputDistances(inputCoords);

                ySteps.ba = ivec2(yStep);
                ySteps.rg = ivec2(yStep - ySign);

                neighborDistances = mmix(maxDistances, ySteps, lessThanEqual(inputDistances, ySteps));
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                ySteps.ba = ivec2(yStep + ySign);
                ySteps.rg = ivec2(yStep);

                neighborDistances = mmix(maxDistances, ySteps, lessThanEqual(inputDistances, ySteps));
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);

                outputDistances = min(outputDistances, candidateDistances);
                if (mmax(outputDistances) <= yStep + 1) 
                {
                    break;
                }
            }

            outputDistances = clamp(outputDistances, 0, ${maxDistance});
            setOutput(vec4(outputDistances));
        }
        `
    }
}

/**
 * Find the Z extent from planar XY distances for all eight octants.
 * The two low bits select the XY input batch and the high bit selects the Z direction.
 */
class ThirdExtendedAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape
        if (inBatch != 4) throw new Error('Batch dimension needs to be 4')
        const maxSteps = Math.min(maxDistance, inDepth-1);
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        ivec4 getInputDistances(ivec4 coords) 
        { 
            return ivec4(getInputDistances(coords.w, coords.z, coords.y, coords.x)); 
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
            return coords.z < 0 || coords.z > ${inDepth-1}; 
        }
       
        int mmax(ivec4 vec) 
        { 
            return max(max(vec.x, vec.y), max(vec.z, vec.w)); 
        }

        ivec4 mmix(ivec4 a, ivec4 b, bvec4 mask) 
        {
            return ivec4(mask) * (b - a) + a;
        }

        const ivec4 maxDistances = ivec4(${maxDistance});

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);

            ivec4 outputDistances = maxDistances;
            ivec4 inputDistances, candidateDistances, zSteps;

            int zSign = getSignFromOutputCoords(outputCoords);
            
            for (int zStep = 0; zStep <= ${maxSteps}; zStep++) 
            {
                inputCoords.z = outputCoords.z + zStep * zSign;
                if (outsideDepth(inputCoords))
                {
                    break;
                }

                zSteps = ivec4(zStep);
                inputDistances = getInputDistances(inputCoords);
                candidateDistances = mmix(maxDistances, zSteps, lessThanEqual(inputDistances, zSteps));

                outputDistances = min(outputDistances, candidateDistances);
                if (mmax(outputDistances) <= zStep + 1) 
                {
                    break;
                }
            }

            outputDistances = clamp(outputDistances, 0, ${maxDistance});
            setOutput(vec4(outputDistances));
        }
        `
    }
}


/** Dispatch a packed WebGL program and wrap its output in a caller-owned tensor. */
function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor 
{
    const backend = tf.backend() as MathBackendWebGL
    return tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(prog, inputs))
}

/**
 * Build the extended distance map consumed by the viewer's block traversal.
 *
 * @param inputOccupancy - Binary [z,y,x] occupancy tensor on the WebGL backend.
 * @param maxDistance - Extent cap in blocks. Use an integer from 1 through 31 for 5-5-5-1 encoding.
 * @returns Caller-owned [octant,z,y,x] tensor of numeric 16-bit words. Bits 15–11,
 * 10–6, and 5–1 store X, Y, and Z extents. Bit 0 stores occupancy. Octant bits
 * 0, 1, and 2 select the X, Y, and Z signs, with 1 selecting the positive side.
 *
 * The renderer uploads these words to R16UI at z + octant*gridDepth.
 * The packing pass requires float32 render textures to preserve every integer word.
 */
export function computeExtendedAnisotropicDistanceMap(inputOccupancy: tf.Tensor3D, maxDistance: number): tf.Tensor4D 
{
    // Seed signed X and Y scans. Together they supply all three planar transforms.
    const firstPassX = new FirstExtendedAnisotropicChebyshevDistancePassX(inputOccupancy.shape, maxDistance)
    const firstPassY = new FirstExtendedAnisotropicChebyshevDistancePassY(inputOccupancy.shape, maxDistance)
    const distance_X0_X1 = runProgram(firstPassX, [inputOccupancy]) as tf.Tensor4D
    const distance_Y0_Y1 = runProgram(firstPassY, [inputOccupancy]) as tf.Tensor4D

    // Build XY, XZ, and YZ, releasing each 1D tensor after its last consumer.
    const secondPassY = new SecondExtendedAnisotropicChebyshevDistancePassY(distance_X0_X1.shape, maxDistance)
    const distance_XY00_XY10_XY01_XY11 = runProgram(secondPassY, [distance_X0_X1]) as tf.Tensor4D; 
    
    const secondPassZ = new SecondExtendedAnisotropicChebyshevDistancePassZ(distance_Y0_Y1.shape, maxDistance)
    const distance_XZ00_XZ10_XZ01_XZ11 = runProgram(secondPassZ, [distance_X0_X1]) as tf.Tensor4D
    tf.dispose(distance_X0_X1)
    
    const distance_YZ00_YZ10_YZ01_YZ11 = runProgram(secondPassZ, [distance_Y0_Y1]) as tf.Tensor4D
    tf.dispose(distance_Y0_Y1)

    // Each planar transform supplies the extent along its omitted axis.
    const thirdPassX = new ThirdExtendedAnisotropicChebyshevDistancePassX(distance_YZ00_YZ10_YZ01_YZ11.shape, maxDistance)
    const distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassX, [distance_YZ00_YZ10_YZ01_YZ11]) as tf.Tensor4D
    tf.dispose(distance_YZ00_YZ10_YZ01_YZ11)

    const thirdPassY = new ThirdExtendedAnisotropicChebyshevDistancePassY(distance_XZ00_XZ10_XZ01_XZ11.shape, maxDistance)
    const distanceY_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassY, [distance_XZ00_XZ10_XZ01_XZ11]) as tf.Tensor4D 
    tf.dispose(distance_XZ00_XZ10_XZ01_XZ11)
    
    const thirdPassZ = new ThirdExtendedAnisotropicChebyshevDistancePassZ(distance_XY00_XY10_XY01_XY11.shape, maxDistance)
    const distanceZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassZ, [distance_XY00_XY10_XY01_XY11]) as tf.Tensor4D
    tf.dispose(distance_XY00_XY10_XY01_XY11)

    // Pack all octants in one pass. The three extent tensors remain live until it completes.
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
