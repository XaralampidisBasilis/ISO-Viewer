import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'


class AnisotropicChessDistancePass implements GPGPUProgram 
{
    variableNames = ['InputVariable']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        inputVariable: 'occupancy' | 'distance',
        inputDirection: '-x' | '+x' | '-y' | '+y' | '-z' | '+z' ,     
        inputDistance: number,
    ) 
    {
        const [inSign, inAxis] = inputDirection
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `
        const ivec3 maxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});
        const int maxDistance = min(${inputDistance}, maxCoords.${inAxis}); 

        ${inputVariable == 'occupancy' ? `
        int getDistance(ivec3 coords) { return bool(getInputVariable(coords.z, coords.y, coords.x, 0)) ? 0 : ${inputDistance}; }` : `
        int getDistance(ivec3 coords) { return  int(getInputVariable(coords.z, coords.y, coords.x, 0)); }`}

        ${inSign == '-' ? `
        bool outBounds(int coord) { return coord < 0; }` : `
        bool outBounds(int coord) { return coord > maxCoords.${inAxis}; }`}

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;
            ivec3 neighborCoords = blockCoords;

            int blockDistance = getDistance(blockCoords);
            if (blockDistance == 0) 
            {
                setOutput(0.0);
                return;
            }

            int neighborDistance;
            for (int stepDistance = 1; stepDistance <= maxDistance; stepDistance++) 
            {
                neighborCoords.${inAxis} = blockCoords.${inAxis} ${inSign} stepDistance;
                if (outBounds(neighborCoords.${inAxis})) 
                {
                    break;
                }

                neighborDistance = max(getDistance(neighborCoords), stepDistance);
                blockDistance = min(blockDistance, neighborDistance);

                if (stepDistance >= blockDistance)
                {
                     break;
                }
                
            }

            setOutput(float(blockDistance));
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

export function anisotropicChessDistanceProgram(inputOccupancy: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    const getChessDistanceAlongX0 = new AnisotropicChessDistancePass(shape, 'occupancy', '-x', maxDistance)
    const getChessDistanceAlongX1 = new AnisotropicChessDistancePass(shape, 'occupancy', '+x', maxDistance)
    const getChessDistanceAlongY0FromX = new AnisotropicChessDistancePass(shape, 'distance',  '-y', maxDistance)
    const getChessDistanceAlongY1FromX = new AnisotropicChessDistancePass(shape, 'distance',  '+y', maxDistance)
    const getChessDistanceAlongZ0FromXY = new AnisotropicChessDistancePass(shape, 'distance',  '-z', maxDistance)
    const getChessDistanceAlongZ1FromXY = new AnisotropicChessDistancePass(shape, 'distance',  '+z', maxDistance)

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