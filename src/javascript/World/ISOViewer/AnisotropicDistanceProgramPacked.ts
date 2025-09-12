import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class AnisotropicChessDistancePassX implements GPGPUProgram 
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
        inputSign: '-' | '+',
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth]
        const inverseSign = inputSign == '-' ? '+' : '-'
        this.userCode = `
        const int maxSteps = ${Math.ceil(Math.min(maxDistance, inWidth-1) / 2) * 2};

        vec4 getInputVariables(ivec3 coords) { return floor(getInputVariables(coords.z, coords.y, coords.x) + 0.5); }
        
        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec3 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${maxDistance}; }` : `
        ivec4 getInputDistances(ivec3 coords) { return ivec4(getInputVariables(coords)); }` }

        ${inputSign == '-' ? `
        bool insideWidth(int coord) { return coord >= 0; }` : `
        bool insideWidth(int coord) { return coord <= ${inWidth-1}; }`}

        void main() 
        {
            ivec3 outputCoords = getOutputCoords();
            
            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances = getInputDistances(blockCoords);
            
            ivec3 candidateCoords = blockCoords;    
            ivec4 candidateDistances = max(blockDistances.grab, ivec4(1));
            
            ${inputSign == '-' ? `
            blockDistances.ga = min(blockDistances.ga, candidateDistances.ga);` : `
            blockDistances.rb = min(blockDistances.rb, candidateDistances.rb);`}
            
            if (all(lessThanEqual(blockDistances, ivec4(1)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            ivec4 inputDistances, neighborDistances;

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                candidateCoords.x = blockCoords.x ${inputSign} stepDistance;
                if (insideWidth(candidateCoords.x)) 
                {                    
                    inputDistances = getInputDistances(candidateCoords);

                    neighborDistances = max(inputDistances, stepDistance ${inputSign} ivec4(0,1,0,1));
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    neighborDistances = max(inputDistances, stepDistance ${inverseSign} ivec4(1,0,1,0));
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

class AnisotropicChessDistancePassY implements GPGPUProgram 
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
        inputSign: '-' | '+',
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth]
        const inverseSign = inputSign == '-' ? '+' : '-'
        this.userCode = `
        const int maxSteps = ${Math.ceil(Math.min(maxDistance, inHeight-1) / 2) * 2};

        vec4 getInputVariables(ivec3 coords) { return floor(getInputVariables(coords.z, coords.y, coords.x) + 0.5); }
        
        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec3 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${maxDistance}; }` : `
        ivec4 getInputDistances(ivec3 coords) { return ivec4(getInputVariables(coords)); }` }

        ${inputSign == '-' ? `
        bool insideHeight(int coord) { return coord >= 0; }` : `
        bool insideHeight(int coord) { return coord <= ${inHeight-1}; }`}

        void main() 
        {
            ivec3 outputCoords = getOutputCoords();
            
            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances = getInputDistances(blockCoords);
            
            ivec3 candidateCoords = blockCoords;    
            ivec4 candidateDistances = max(blockDistances.barg, ivec4(1));
        
            ${inputSign == '-' ? `
            blockDistances.ba = min(blockDistances.ba, candidateDistances.ba);` : `
            blockDistances.rg = min(blockDistances.rg, candidateDistances.rg);`}

            if (all(lessThanEqual(blockDistances, ivec4(1)))) 
            {
                setOutput(vec4(blockDistances));
                return;
            }

            ivec4 inputDistances, neighborDistances;

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                candidateCoords.y = blockCoords.y ${inputSign} stepDistance;
                if (insideHeight(candidateCoords.y)) 
                {   
                    inputDistances = getInputDistances(candidateCoords);

                    neighborDistances = max(inputDistances, stepDistance ${inputSign} ivec4(0,0,1,1));
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);

                    neighborDistances = max(inputDistances, stepDistance ${inverseSign} ivec4(1,1,0,0));
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

class AnisotropicChessDistancePassZ implements GPGPUProgram 
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
        inputSign: '-' | '+',
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.min(maxDistance, inDepth-1)};

        vec4 getInputVariables(ivec3 coords) { return floor(getInputVariables(coords.z, coords.y, coords.x) + 0.5); }

        ${inputVariable == 'occupancy' ? `            
        ivec4 getInputDistances(ivec3 coords) { return ivec4(lessThan(getInputVariables(coords), vec4(0.5))) * ${maxDistance}; }` : `
        ivec4 getInputDistances(ivec3 coords) { return ivec4(getInputVariables(coords)); }` }

        ${inputSign == '-' ? `
        bool insideDepth(int coord) { return coord >= 0; }` : `
        bool insideDepth(int coord) { return coord <= ${inDepth-1}; }`}

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

            for (int stepDistance = 1; stepDistance <= maxSteps; stepDistance++) 
            {
                candidateCoords.z = blockCoords.z ${inputSign} stepDistance;
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

export function anisotropicChessDistanceProgramPacked(inputOccupancy: tf.Tensor3D, maxDistance: number): tf.Tensor3D 
{
    const shape = inputOccupancy.shape

    const getChessDistanceAlongX0 = new AnisotropicChessDistancePassX(shape, 'occupancy', '-', maxDistance)
    const getChessDistanceAlongX1 = new AnisotropicChessDistancePassX(shape, 'occupancy', '+', maxDistance)
    const getChessDistanceAlongY0FromX = new AnisotropicChessDistancePassY(shape, 'distance',  '-', maxDistance)
    const getChessDistanceAlongY1FromX = new AnisotropicChessDistancePassY(shape, 'distance',  '+', maxDistance)
    const getChessDistanceAlongZ0FromXY = new AnisotropicChessDistancePassZ(shape, 'distance',  '-', maxDistance)
    const getChessDistanceAlongZ1FromXY = new AnisotropicChessDistancePassZ(shape, 'distance',  '+', maxDistance)

    // 1D 
    const chessDistanceOverX0 = runProgram(getChessDistanceAlongX0, [inputOccupancy])
    const chessDistanceOverX1 = runProgram(getChessDistanceAlongX1, [inputOccupancy])

    // 2D
    const chessDistanceOverXY00 = runProgram(getChessDistanceAlongY0FromX, [chessDistanceOverX0]);
    const chessDistanceOverXY01 = runProgram(getChessDistanceAlongY1FromX, [chessDistanceOverX0]); tf.dispose(chessDistanceOverX0)
    const chessDistanceOverXY10 = runProgram(getChessDistanceAlongY0FromX, [chessDistanceOverX1]);
    const chessDistanceOverXY11 = runProgram(getChessDistanceAlongY1FromX, [chessDistanceOverX1]); tf.dispose(chessDistanceOverX1)

    // 3D
    const chessDistanceOverXYZ000 = runProgram(getChessDistanceAlongZ0FromXY, [chessDistanceOverXY00]);
    const chessDistanceOverXYZ001 = runProgram(getChessDistanceAlongZ1FromXY, [chessDistanceOverXY00]); tf.dispose(chessDistanceOverXY00)
    const chessDistanceOverXYZ010 = runProgram(getChessDistanceAlongZ0FromXY, [chessDistanceOverXY01]);
    const chessDistanceOverXYZ011 = runProgram(getChessDistanceAlongZ1FromXY, [chessDistanceOverXY01]); tf.dispose(chessDistanceOverXY01)
    const chessDistanceOverXYZ100 = runProgram(getChessDistanceAlongZ0FromXY, [chessDistanceOverXY10]);
    const chessDistanceOverXYZ101 = runProgram(getChessDistanceAlongZ1FromXY, [chessDistanceOverXY10]); tf.dispose(chessDistanceOverXY10)
    const chessDistanceOverXYZ110 = runProgram(getChessDistanceAlongZ0FromXY, [chessDistanceOverXY11]);
    const chessDistanceOverXYZ111 = runProgram(getChessDistanceAlongZ1FromXY, [chessDistanceOverXY11]); tf.dispose(chessDistanceOverXY11)
    // 
    // Concatenate directional distance maps in binary order
    const chessDistancesOverXYZ = tf.concat([
        chessDistanceOverXYZ000,
        chessDistanceOverXYZ100,
        chessDistanceOverXYZ010,
        chessDistanceOverXYZ110,
        chessDistanceOverXYZ001,
        chessDistanceOverXYZ101,
        chessDistanceOverXYZ011,
        chessDistanceOverXYZ111,
    ], 0)

    tf.dispose([
        chessDistanceOverXYZ000,
        chessDistanceOverXYZ100,
        chessDistanceOverXYZ010,
        chessDistanceOverXYZ110,
        chessDistanceOverXYZ001,
        chessDistanceOverXYZ101,
        chessDistanceOverXYZ011,
        chessDistanceOverXYZ111,
    ])

    return chessDistancesOverXYZ
}