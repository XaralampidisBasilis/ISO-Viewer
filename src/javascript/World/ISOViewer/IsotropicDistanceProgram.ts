import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class IsotropicChessDistancePass implements GPGPUProgram 
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
        inputAxis: 'x' | 'y' | 'z',     
        inputDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `
        const ivec3 maxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});
        const int maxDistance = min(${inputDistance}, maxCoords.${inputAxis}); 

        ${inputVariable == 'occupancy' ? `
        int getDistance(ivec3 coords) { return int(getInputVariable(coords.z, coords.y, coords.x, 0) < 0.5) * ${inputDistance}; }` : `
        int getDistance(ivec3 coords) { return int(getInputVariable(coords.z, coords.y, coords.x, 0)); }` }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();

            ivec3 blockCoords = outputCoords.zyx;
            int blockDistance = getDistance(blockCoords);

            ivec3 candidateCoords = blockCoords;
            int candidateDistance = blockDistance;

            if (blockDistance == 0) 
            {
                setOutput(0.0);
                return;
            }

            for (int stepDistance = 1; stepDistance <= maxDistance; stepDistance++) 
            {
                candidateCoords.${inputAxis} = blockCoords.${inputAxis} - stepDistance;
                if (candidateCoords.${inputAxis} >= 0) 
                {
                    candidateDistance = max(getDistance(candidateCoords), stepDistance);
                    blockDistance = min(blockDistance, candidateDistance);

                    if (blockDistance <= stepDistance) 
                    {
                        break;
                    }
                }

                candidateCoords.${inputAxis} = blockCoords.${inputAxis} + stepDistance;
                if (candidateCoords.${inputAxis} <= maxCoords.${inputAxis}) 
                {
                    candidateDistance = max(getDistance(candidateCoords), stepDistance);
                    blockDistance = min(blockDistance, candidateDistance);
                    
                    if (blockDistance <= stepDistance) 
                    {
                        break;
                    }
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

export function isotropicChessDistanceProgram(inputOccupancy: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    const getChessDistanceAlongX = new IsotropicChessDistancePass(shape, 'occupancy', 'x', maxDistance)
    const getChessDistanceAlongYFromX = new IsotropicChessDistancePass(shape, 'distance',  'y', maxDistance)
    const getChessDistanceAlongZFromXY = new IsotropicChessDistancePass(shape, 'distance',  'z', maxDistance)
 
    const chessDistanceOverX = runProgram(getChessDistanceAlongX, [inputOccupancy]);
    // const chessDistanceOverXY = runProgram(getChessDistanceAlongYFromX, [chessDistanceOverX]); tf.dispose(chessDistanceOverX)
    // const chessDistanceOverXYZ = runProgram(getChessDistanceAlongZFromXY, [chessDistanceOverXY]); tf.dispose(chessDistanceOverXY)

    return chessDistanceOverX
    
}