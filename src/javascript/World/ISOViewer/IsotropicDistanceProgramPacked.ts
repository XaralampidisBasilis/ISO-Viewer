import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'


class IsotropicChessDistancePassX implements GPGPUProgram 
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
        inputDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxDistance = ${Math.min(inputDistance, inWidth-1)};

        vec4 getInputVariables(ivec3 coords) { return floor(getInputVariables(coords.z, coords.y, coords.x) + 0.5); }
        
        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec3 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${inputDistance}; }` : `
        ivec4 getInputDistances(ivec3 coords) { return ivec4(getInputVariables(coords)); }` }

        void main() 
        {
            ivec3 outputCoords = getOutputCoords();
            
            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances = getInputDistances(blockCoords);
            
            ivec3 candidateCoords = blockCoords;    
            ivec4 candidateDistances = max(blockDistances.grab, ivec4(1));
        
            blockDistances = min(blockDistances, candidateDistances);

            if (all(lessThanEqual(blockDistances, ivec4(1)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            ivec4 inputDistances, stepDistances, neighborDistances;

            for (int stepDistance = 2; stepDistance <= maxDistance; stepDistance += 2) 
            {
                candidateCoords.x = blockCoords.x - stepDistance;
                if (candidateCoords.x >= 0) 
                {                    
                    inputDistances = getInputDistances(candidateCoords);

                    neighborDistances = max(inputDistances, stepDistance + ivec4(1,0,1,0));
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                    
                    neighborDistances = max(inputDistances, stepDistance - ivec4(0,1,0,1));
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    blockDistances = min(blockDistances, candidateDistances);
                }
                
                candidateCoords.x = blockCoords.x + stepDistance;
                if (candidateCoords.x <= ${inWidth-1}) 
                {
                    inputDistances = getInputDistances(candidateCoords);

                    neighborDistances = max(inputDistances, stepDistance + ivec4(0,1,0,1));
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    neighborDistances = max(inputDistances, stepDistance - ivec4(1,0,1,0));
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);

                    blockDistances = min(blockDistances, candidateDistances);

                    
                }

                if (all(lessThanEqual(blockDistances, ivec4(stepDistance + 1)))) 
                {
                    break;
                }
            }

            blockDistances = clamp(blockDistances, ivec4(0), ivec4(${inputDistance}));

            setOutput(vec4(blockDistances));
        }
        `
    }
}

class IsotropicChessDistancePassY implements GPGPUProgram 
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
        inputDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxDistance = ${Math.min(inputDistance, inHeight-1)};

        vec4 getInputVariables(ivec3 coords) { return floor(getInputVariables(coords.z, coords.y, coords.x) + 0.5); }
        
        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec3 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${inputDistance}; }` : `
        ivec4 getInputDistances(ivec3 coords) { return ivec4(getInputVariables(coords)); }` }

        void main() 
        {
            ivec3 outputCoords = getOutputCoords();
            
            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances = getInputDistances(blockCoords);
            
            ivec3 candidateCoords = blockCoords;    
            ivec4 candidateDistances = max(blockDistances.barg, ivec4(1));
        
            blockDistances = min(blockDistances, candidateDistances);

            if (all(lessThanEqual(blockDistances, ivec4(1)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            ivec4 inputDistances, stepDistances, neighborDistances;

            for (int stepDistance = 2; stepDistance <= maxDistance; stepDistance += 2) 
            {
                candidateCoords.y = blockCoords.y - stepDistance;
                if (candidateCoords.y >= 0) 
                {                    
                    inputDistances = getInputDistances(candidateCoords);

                    neighborDistances = max(inputDistances, stepDistance + ivec4(1,1,0,0));
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                    
                    neighborDistances = max(inputDistances, stepDistance - ivec4(0,0,1,1));
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);

                    blockDistances = min(blockDistances, candidateDistances);
                }
                
                candidateCoords.y = blockCoords.y + stepDistance;
                if (candidateCoords.y <= ${inHeight-1}) 
                {
                    inputDistances = getInputDistances(candidateCoords);

                    neighborDistances = max(inputDistances, stepDistance + ivec4(0,0,1,1));
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);

                    neighborDistances = max(inputDistances, stepDistance - ivec4(1,1,0,0));
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                    blockDistances = min(blockDistances, candidateDistances);

                    
                }

                if (all(lessThanEqual(blockDistances, ivec4(stepDistance + 1)))) 
                {
                    break;
                }
            }

            blockDistances = clamp(blockDistances, ivec4(0), ivec4(${inputDistance}));

            setOutput(vec4(blockDistances));
        }
        `
    }
}

class IsotropicChessDistancePassZ implements GPGPUProgram 
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
        inputDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxDistance = ${Math.min(inputDistance, inDepth-1)};

        vec4 getInputVariables(ivec3 coords) { return floor(getInputVariables(coords.z, coords.y, coords.x) + 0.5); }

        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec3 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${inputDistance}; }` : `
        ivec4 getInputDistances(ivec3 coords) { return ivec4(getInputVariables(coords)); }` }

        void main() 
        {
            ivec3 outputCoords = getOutputCoords();

            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances = getInputDistances(blockCoords);

            ivec3 candidateCoords = blockCoords;
            ivec4 candidateDistances = blockDistances;

            if (all(equal(blockDistances, ivec4(0)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            for (int stepDistance = 1; stepDistance <= maxDistance; stepDistance++) 
            {
                candidateCoords.z = blockCoords.z - stepDistance;
                if (candidateCoords.z >= 0) 
                {
                    candidateDistances = max(getInputDistances(candidateCoords), ivec4(stepDistance));
                    blockDistances = min(blockDistances, candidateDistances);

                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance)))) 
                    {
                        break;
                    }
                }

                candidateCoords.z = blockCoords.z + stepDistance;
                if (candidateCoords.z < ${inDepth}) 
                {
                    candidateDistances = max(getInputDistances(candidateCoords), ivec4(stepDistance));
                    blockDistances = min(blockDistances, candidateDistances);
                    
                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance)))) 
                    {
                        break;
                    }
                }
            }

            blockDistances = clamp(blockDistances, ivec4(0), ivec4(${inputDistance}));

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

export function isotropicChessDistanceProgramPacked(inputOccupancy: tf.Tensor3D, maxDistance: number): tf.Tensor3D 
{
    const shape = inputOccupancy.shape

    const getChessDistanceAlongX = new IsotropicChessDistancePassX(shape, 'occupancy', maxDistance)
    const getChessDistanceAlongYFromX = new IsotropicChessDistancePassY(shape, 'distance', maxDistance)
    const getChessDistanceAlongZFromXY = new IsotropicChessDistancePassZ(shape, 'distance', maxDistance)
 
    const chessDistanceOverX = runProgram(getChessDistanceAlongX, [inputOccupancy]);
    const chessDistanceOverXY = runProgram(getChessDistanceAlongYFromX, [chessDistanceOverX]); tf.dispose(chessDistanceOverX)
    const chessDistanceOverXYZ = runProgram(getChessDistanceAlongZFromXY, [chessDistanceOverXY]); tf.dispose(chessDistanceOverXY)

    return chessDistanceOverXYZ
}
