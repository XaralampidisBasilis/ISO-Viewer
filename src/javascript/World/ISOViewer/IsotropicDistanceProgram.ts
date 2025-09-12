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
        inputShape: [number, number, number], 
        inputVariable: 'occupancy' | 'distance',
        inputAxis: 'x' | 'y' | 'z',     
        inputDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth]
        this.userCode = `
        const ivec3 maxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});
        const int maxDistance = min(${inputDistance}, maxCoords.${inputAxis}); 

        float getInputVariable(ivec3 coords) { return floor(getInputVariable(coords.z, coords.y, coords.x) + 0.5); }

        ${inputVariable == 'occupancy' ? `
        int getInputDistance(ivec3 coords) { return int(getInputVariable(coords) < 0.5) * ${inputDistance}; }` : `
        int getInputDistance(ivec3 coords) { return int(getInputVariable(coords)); }` }

        void main() 
        {
            ivec3 outputCoords = getOutputCoords();

            ivec3 blockCoords = outputCoords.zyx;
            int blockDistance = getInputDistance(blockCoords);

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
                    candidateDistance = max(getInputDistance(candidateCoords), stepDistance);
                    blockDistance = min(blockDistance, candidateDistance);

                    if (blockDistance <= stepDistance) 
                    {
                        break;
                    }
                }

                candidateCoords.${inputAxis} = blockCoords.${inputAxis} + stepDistance;
                if (candidateCoords.${inputAxis} <= maxCoords.${inputAxis}) 
                {
                    candidateDistance = max(getInputDistance(candidateCoords), stepDistance);
                    blockDistance = min(blockDistance, candidateDistance);
                    
                    if (blockDistance <= stepDistance) 
                    {
                        break;
                    }
                }
            }

            blockDistance = clamp(blockDistance, 0, ${inputDistance});

            setOutput(float(blockDistance));
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

export function isotropicChessDistanceProgram(inputOccupancy: tf.Tensor3D, maxDistance: number): tf.Tensor3D 
{
    const shape = inputOccupancy.shape

    const getChessDistanceAlongX = new IsotropicChessDistancePass(shape, 'occupancy', 'x', maxDistance)
    const getChessDistanceAlongYFromX = new IsotropicChessDistancePass(shape, 'distance',  'y', maxDistance)
    const getChessDistanceAlongZFromXY = new IsotropicChessDistancePass(shape, 'distance',  'z', maxDistance)
 
    const chessDistanceOverX = runProgram(getChessDistanceAlongX, [inputOccupancy]);
    const chessDistanceOverXY = runProgram(getChessDistanceAlongYFromX, [chessDistanceOverX]); tf.dispose(chessDistanceOverX)
    const chessDistanceOverXYZ = runProgram(getChessDistanceAlongZFromXY, [chessDistanceOverXY]); tf.dispose(chessDistanceOverXY)

    return chessDistanceOverXYZ
    
}