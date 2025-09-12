import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class AnisotropicChessDistancePassesX implements GPGPUProgram 
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
        this.outputShape = [2 * inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.ceil(Math.min(maxDistance, inWidth-1) / 2) * 2};

        vec4 getInputVariables(ivec3 coords) { return floor(getInputVariables(coords.z, coords.y, coords.x) + 0.5); }
        
        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec3 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${maxDistance}; }` : `
        ivec4 getInputDistances(ivec3 coords) { return ivec4(getInputVariables(coords)); }` }

        bool insideWidth(int coord) { return coord >= 0 && coord <= ${inWidth-1}; }

        void main() 
        {
            ivec3 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;

            int sign = blockCoords.z < ${inDepth} ? -1 : 1;
            blockCoords.z = blockCoords.z % ${inDepth};

            ivec4 blockDistances = getInputDistances(blockCoords);
            
            ivec3 candidateCoords = blockCoords;    
            ivec4 candidateDistances = max(blockDistances.grab, ivec4(1));
    
            if (sign < 0)
                blockDistances.ga = min(blockDistances.ga, candidateDistances.ga);
            else
                blockDistances.rb = min(blockDistances.rb, candidateDistances.rb);
            
            if (all(lessThanEqual(blockDistances, ivec4(1)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            ivec4 inputDistances, neighborDistances;

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                candidateCoords.x = blockCoords.x + stepDistance * sign;
                if (insideWidth(candidateCoords.x)) 
                {                    
                    inputDistances = getInputDistances(candidateCoords);

                    neighborDistances = max(inputDistances, stepDistance + ivec4(0,1,0,1) * sign);
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    neighborDistances = max(inputDistances, stepDistance - ivec4(1,0,1,0) * sign);
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

class AnisotropicChessDistancePassesY implements GPGPUProgram 
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
        this.outputShape = [4 * inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.ceil(Math.min(maxDistance, inHeight-1) / 2) * 2};

        vec4 getInputVariables(ivec3 coords) { return floor(getInputVariables(coords.z, coords.y, coords.x) + 0.5); }
        
        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec3 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${maxDistance}; }` : `
        ivec4 getInputDistances(ivec3 coords) { return ivec4(getInputVariables(coords)); }` }

        bool insideHeight(int coord) { return coord >= 0 && coord <= ${inHeight-1}; }

        void main() 
        {
            ivec3 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;

            int sign = blockCoords.z < ${inDepth * 2} ? -1 : 1;
            blockCoords.z = blockCoords.z % ${inDepth * 2};

            ivec4 blockDistances = getInputDistances(blockCoords);
            
            ivec3 candidateCoords = blockCoords;    
            ivec4 candidateDistances = max(blockDistances.barg, ivec4(1));
        
            if (sign < 0)
                blockDistances.ba = min(blockDistances.ba, candidateDistances.ba);
            else
                blockDistances.rg = min(blockDistances.rg, candidateDistances.rg);

            if (all(lessThanEqual(blockDistances, ivec4(1)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            ivec4 inputDistances, neighborDistances;

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                candidateCoords.y = blockCoords.y + stepDistance * sign;
                if (insideHeight(candidateCoords.y)) 
                {   
                    inputDistances = getInputDistances(candidateCoords);

                    neighborDistances = max(inputDistances, stepDistance + ivec4(0,0,1,1) * sign);
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);

                    neighborDistances = max(inputDistances, stepDistance - ivec4(1,1,0,0) * sign);
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

class AnisotropicChessDistancePassesZ implements GPGPUProgram 
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
        this.outputShape = [8 * inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.min(maxDistance, inDepth-1)};

        vec4 getInputVariables(ivec3 coords) { return floor(getInputVariables(coords.z, coords.y, coords.x) + 0.5); }

        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec3 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${maxDistance}; }` : `
        ivec4 getInputDistances(ivec3 coords) { return ivec4(getInputVariables(coords)); }` }

        bool insideDepth(int coord) { return coord >= 0 && coord <= ${inDepth-1}; }

        void main() 
        {
            ivec3 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;

            int sign = blockCoords.z < ${inDepth * 4} ? -1 : 1;
            blockCoords.z = blockCoords.z % ${inDepth * 4};

            ivec4 blockDistances = getInputDistances(blockCoords);

            ivec3 candidateCoords = blockCoords;
            ivec4 candidateDistances = blockDistances;

            if (all(equal(blockDistances, ivec4(0)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            for (int stepDistance = 1; stepDistance <= maxSteps; stepDistance++) 
            {
                candidateCoords.z = blockCoords.z + stepDistance * sign;
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


function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor3D 
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor3D
}

export function anisotropicChessDistanceProgramPackedFused(inputOccupancy: tf.Tensor3D, maxDistance: number): tf.Tensor3D 
{
    const shape = inputOccupancy.shape

    const getChessDistanceAlongX = new AnisotropicChessDistancePassesX(shape, 'occupancy', maxDistance)
    const getChessDistanceAlongY = new AnisotropicChessDistancePassesY(shape, 'distance',  maxDistance)
    const getChessDistanceAlongZ = new AnisotropicChessDistancePassesZ(shape, 'distance',  maxDistance)

    // 1D 
    const distances_X0_X1 = runProgram(getChessDistanceAlongX, [inputOccupancy])

    // 2D
    const distances_XY00_XY10_XY01_XY11 = runProgram(getChessDistanceAlongY, [distances_X0_X1]); 
    tf.dispose(distances_X0_X1)

    // 3D
    const distances_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(getChessDistanceAlongZ, [distances_XY00_XY10_XY01_XY11]);
     tf.dispose(distances_XY00_XY10_XY01_XY11)

    return distances_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111
}
