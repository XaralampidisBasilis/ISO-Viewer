import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class IsotropicChessDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputVariable']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        inputVariable: 'occupancy' | 'distance',
        inputDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `
        const ivec4 innerDistances = ivec4(0,0,1,1);
        const int maxDistance = ${Math.min(inputDistance, inWidth-1)};

        ${inputVariable == 'occupancy' ? `            
        ivec4 getDistances(ivec3 coords) { return ivec4(lessThan(getInputVariable(coords.z, coords.y, coords.x, 0), vec4(0.5))) * ${inputDistance}; }` : `
        ivec4 getDistances(ivec3 coords) { return ivec4(round(getInputVariable(coords.z, coords.y, coords.x, 0))); }` }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            
            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances = getDistances(blockCoords);
            
            ivec3 candidateCoords = blockCoords;
            ivec4 candidateDistances = max(blockDistances.barg, ivec4(1));

            blockDistances = min(blockDistances, candidateDistances);
            if (all(lessThanEqual(blockDistances, ivec4(1)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxDistance; stepDistance += 2) 
            {
                candidateCoords.x = blockCoords.x - stepDistance;
                if (candidateCoords.x >= 0) 
                {
                    candidateDistances = max(getDistances(candidateCoords), ivec4(stepDistance) - innerDistances);
                    candidateDistances.ba = min(candidateDistances.ba, candidateDistances.rg);

                    blockDistances = min(blockDistances, candidateDistances.baba + innerDistances);
                    
                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance) + innerDistances))) 
                    {
                        break;
                    }
                }
                    
                candidateCoords.x = blockCoords.x + stepDistance;
                if (candidateCoords.x < ${inWidth}) 
                {
                    candidateDistances = max(getDistances(candidateCoords), ivec4(stepDistance) + innerDistances);
                    candidateDistances.rg = min(candidateDistances.rg, candidateDistances.ba);

                    blockDistances = min(blockDistances, candidateDistances.rgrg - innerDistances);

                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance + 1) - innerDistances))) 
                    {
                        break;
                    }
                }
            }

            blockDistances = clamp(blockDistances, 0, ${inputDistance});

            setOutput(vec4(blockDistances));
        }
        `
    }
}

class IsotropicChessDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputVariable']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        inputVariable: 'occupancy' | 'distance',
        inputDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `
        const ivec4 innerDistances = ivec4(0,1,0,1);
        const int maxDistance = ${Math.min(inputDistance, inHeight-1)};

        ${inputVariable == 'occupancy' ? `            
        ivec4 getDistances(ivec3 coords) { return ivec4(lessThan(getInputVariable(coords.z, coords.y, coords.x, 0), vec4(0.5))) * ${inputDistance}; }` : `
        ivec4 getDistances(ivec3 coords) { return ivec4(round(getInputVariable(coords.z, coords.y, coords.x, 0))); }` }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            
            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances = getDistances(blockCoords);
            
            ivec3 candidateCoords = blockCoords;    
            ivec4 candidateDistances = max(blockDistances.grab, ivec4(1));

            blockDistances = min(blockDistances, candidateDistances);
            if (all(lessThanEqual(blockDistances, ivec4(1)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxDistance; stepDistance += 2) 
            {
                candidateCoords.y = blockCoords.y - stepDistance;
                if (candidateCoords.y >= 0) 
                {
                    candidateDistances = max(getDistances(candidateCoords), ivec4(stepDistance) - innerDistances);
                    candidateDistances.ga = min(candidateDistances.ga, candidateDistances.rb);

                    blockDistances = min(blockDistances, candidateDistances.ggaa + innerDistances);
                    
                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance) + innerDistances))) 
                    {
                        break;
                    }
                }
                    
                candidateCoords.y = blockCoords.y + stepDistance;
                if (candidateCoords.y < ${inHeight}) 
                {
                    candidateDistances = max(getDistances(candidateCoords), ivec4(stepDistance) + innerDistances);
                    candidateDistances.rb = min(candidateDistances.rb, candidateDistances.ga);

                    blockDistances = min(blockDistances, candidateDistances.rrbb - innerDistances);

                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance + 1) - innerDistances))) 
                    {
                        break;
                    }
                }
            }

            blockDistances = clamp(blockDistances, 0, ${inputDistance});

            setOutput(vec4(blockDistances));
        }
        `
    }
}

class IsotropicChessDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputVariable']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        inputVariable: 'occupancy' | 'distance',
        inputDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `
        const int maxDistance = ${Math.min(inputDistance, inDepth-1)};


        ${inputVariable == 'occupancy' ? `            
        ivec4 getDistances(ivec3 coords) { return ivec4(lessThan(getInputVariable(coords.z, coords.y, coords.x, 0), vec4(0.5))) * ${inputDistance}; }` : `
        ivec4 getDistances(ivec3 coords) { return ivec4(round(getInputVariable(coords.z, coords.y, coords.x, 0))); }` }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();

            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances = getDistances(blockCoords);

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
                    candidateDistances = max(getDistances(candidateCoords), ivec4(stepDistance));
                    blockDistances = min(blockDistances, candidateDistances);

                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance)))) 
                    {
                        break;
                    }
                }

                candidateCoords.z = blockCoords.z + stepDistance;
                if (candidateCoords.z < ${inDepth}) 
                {
                    candidateDistances = max(getDistances(candidateCoords), ivec4(stepDistance));
                    blockDistances = min(blockDistances, candidateDistances);
                    
                    if (all(lessThanEqual(blockDistances, ivec4(stepDistance)))) 
                    {
                        break;
                    }
                }
            }

            blockDistances = clamp(blockDistances, 0, ${inputDistance});

            setOutput(vec4(blockDistances));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor4D
}

export function isotropicChessDistanceProgramPacked(inputOccupancy: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    const getChessDistanceAlongX = new IsotropicChessDistancePassX(shape, 'occupancy', maxDistance)
    const getChessDistanceAlongYFromX = new IsotropicChessDistancePassY(shape, 'distance', maxDistance)
    const getChessDistanceAlongZFromXY = new IsotropicChessDistancePassZ(shape, 'distance', maxDistance)
 
    const chessDistanceOverX = runProgram(getChessDistanceAlongX, [inputOccupancy]);
    // const chessDistanceOverXY = runProgram(getChessDistanceAlongYFromX, [chessDistanceOverX]); tf.dispose(chessDistanceOverX)
    // const chessDistanceOverXYZ = runProgram(getChessDistanceAlongZFromXY, [chessDistanceOverXY]); tf.dispose(chessDistanceOverXY)

    return chessDistanceOverX
}
