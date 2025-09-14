import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class FirstAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputVariables']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        inputVariable: 'occupancy' | 'distance',
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.ceil(Math.min(maxDistance, inWidth-1) / 2) * 2};

        vec4 getInputVariables(ivec3 coords) { return floor(getInputVariables(coords.z, coords.y, coords.x) + 0.5); }
        
        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec3 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${maxDistance}; }` : `
        ivec4 getInputDistances(ivec3 coords) { return ivec4(getInputVariables(coords)); }` }

        bool insideWidth(int coord) { return coord >= 0 && coord <= ${inWidth-1}; }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            int sign = (outputCoords.w < 1) ? -1 : 1;

            ivec3 blockCoords = outputCoords.xyz;
            ivec4 blockDistances = getInputDistances(blockCoords);
            
            ivec3 candidateCoords = blockCoords;    
            ivec4 candidateDistances = max(blockDistances.grab, ivec4(1));
    
            if (sign < 0) blockDistances.ga = min(blockDistances.ga, candidateDistances.ga);
            if (sign > 0) blockDistances.rb = min(blockDistances.rb, candidateDistances.rb);

            if (all(lessThanEqual(blockDistances, ivec4(1)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            ivec4 inputDistances, neighborDistances;

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                candidateCoords.x = blockCoords.x + sign * stepDistance ;
                if (insideWidth(candidateCoords.x)) 
                {                    
                    inputDistances = getInputDistances(candidateCoords);

                    neighborDistances = max(inputDistances, stepDistance + sign * ivec4(0,1,0,1));
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    neighborDistances = max(inputDistances, stepDistance - sign * ivec4(1,0,1,0));
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga); 

                    blockDistances = min(blockDistances, candidateDistances);

                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance + 1)))) 
                    {
                        break;
                    }
                }
            }

            blockDistances = clamp(blockDistances, ivec4(0), ivec4(${maxDistance}));

            setOutput(vec4(blockDistances));
        }
        `
    }
}

class SecondAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputVariables']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        inputVariable: 'occupancy' | 'distance',
        maxDistance: number,
    ) 
    {
        const [inBatches, inDepth, inHeight, inWidth] = inputShape
        if (inBatches != 2) throw new Error('Input batch needs to be 2');

        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.ceil(Math.min(maxDistance, inHeight-1) / 2) * 2};

        vec4 getInputVariables(ivec4 coords) { return floor(getInputVariables(coords.w, coords.z, coords.y, coords.x) + 0.5); }
        
        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec4 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${maxDistance}; }` : `
        ivec4 getInputDistances(ivec4 coords) { return ivec4(getInputVariables(coords)); }` }

        bool insideHeight(int coord) { return coord >= 0 && coord <= ${inHeight-1}; }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            int sign = (outputCoords.w < 2) ? -1 : 1;
            
            ivec4 blockCoords = ivec4(outputCoords.xyz, outputCoords.w % 2);
            ivec4 blockDistances = getInputDistances(blockCoords);
            
            ivec4 candidateCoords = blockCoords;    
            ivec4 candidateDistances = max(blockDistances.barg, ivec4(1));
        
            if (sign < 0) blockDistances.ba = min(blockDistances.ba, candidateDistances.ba);
            if (sign > 0) blockDistances.rg = min(blockDistances.rg, candidateDistances.rg);

            if (all(lessThanEqual(blockDistances, ivec4(1)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            ivec4 inputDistances, neighborDistances;

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                candidateCoords.y = blockCoords.y + sign * stepDistance;
                if (insideHeight(candidateCoords.y)) 
                {   
                    inputDistances = getInputDistances(candidateCoords);

                    neighborDistances = max(inputDistances, stepDistance + sign * ivec4(0,0,1,1));
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);

                    neighborDistances = max(inputDistances, stepDistance - sign * ivec4(1,1,0,0));
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                    
                    blockDistances = min(blockDistances, candidateDistances);

                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance + 1)))) 
                    {
                        break;
                    }
                }
            }

            blockDistances = clamp(blockDistances, ivec4(0), ivec4(${maxDistance}));

            setOutput(vec4(blockDistances));
        }
        `
    }
}

class ThirdAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputVariables']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        inputVariable: 'occupancy' | 'distance',
        maxDistance: number,
    ) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape
        if (inBatch != 4) throw new Error('Batch dimension needs to be 2');

        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.min(maxDistance, inDepth-1)};

        vec4 getInputVariables(ivec4 coords) { return floor(getInputVariables(coords.w, coords.z, coords.y, coords.x) + 0.5); }

        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec4 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${maxDistance}; }` : `
        ivec4 getInputDistances(ivec4 coords) { return ivec4(getInputVariables(coords)); }` }

        bool insideDepth(int coord) { return coord >= 0 && coord <= ${inDepth-1}; }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            int sign = (outputCoords.w < 4) ? -1 : 1;

            ivec4 blockCoords = ivec4(outputCoords.xyz, outputCoords.w % 4);
            ivec4 blockDistances = getInputDistances(blockCoords);

            ivec4 candidateCoords = blockCoords;
            ivec4 candidateDistances = blockDistances;

            if (all(equal(blockDistances, ivec4(0)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            for (int stepDistance = 1; stepDistance <= maxSteps; stepDistance++) 
            {
                candidateCoords.z = blockCoords.z + sign * stepDistance;
                if (insideDepth(candidateCoords.z))
                {
                    candidateDistances = max(getInputDistances(candidateCoords), ivec4(stepDistance));
                    blockDistances = min(blockDistances, candidateDistances);

                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance)))) 
                    {
                        break;
                    }
                }
            }

            blockDistances = clamp(blockDistances, ivec4(0), ivec4(${maxDistance}));

            setOutput(vec4(blockDistances));
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

export function anisotropicChessDistanceProgramPackedFused(inputOccupancy: tf.Tensor3D, maxDistance: number) : tf.Tensor4D
{
    // 1D 
    const getChessDistanceAlongX = new FirstAnisotropicChebyshevDistancePassX(inputOccupancy.shape, 'occupancy', maxDistance)
    const distances_X0_X1 = runProgram(getChessDistanceAlongX, [inputOccupancy]) as tf.Tensor4D

    // 2D
    const getChessDistanceAlongY = new SecondAnisotropicChebyshevDistancePassY(distances_X0_X1.shape, 'distance',  maxDistance)
    const distances_XY00_XY10_XY01_XY11 = runProgram(getChessDistanceAlongY, [distances_X0_X1]) as tf.Tensor4D
    tf.dispose(distances_X0_X1)

    // 3D
    const getChessDistanceAlongZ = new ThirdAnisotropicChebyshevDistancePassZ(distances_XY00_XY10_XY01_XY11.shape, 'distance',  maxDistance)
    const distances_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(getChessDistanceAlongZ, [distances_XY00_XY10_XY01_XY11]) as tf.Tensor4D
    tf.dispose(distances_XY00_XY10_XY01_XY11)


    return distances_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 
}
