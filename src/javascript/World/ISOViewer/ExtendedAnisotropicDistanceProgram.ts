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

class ExtendedAnisotropicChessDistancePass implements GPGPUProgram 
{
    variableNames = ['Distance']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        inputDirection: '-x' | '+x' | '-y' | '+y' | '-z' | '+z',     
        inputDistance: number
    ) 
    {
        const [inSign, inAxis] = inputDirection
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]

        this.userCode = `
        const ivec3 maxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});
        const int maxDistance = min(${inputDistance}, maxCoords.${inAxis}); 
        
        ${inSign == '-' ? `
        bool outBounds(int coord) { return coord < 0; }` : `
        bool outBounds(int coord) { return coord > maxCoords.${inAxis}; }`}
        
        int getDistance(ivec3 coords) { return int(getDistance(coords.z, coords.y, coords.x, 0)); }

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
            blockDistance = maxDistance;
            for (int stepDistance = 1; stepDistance <= maxDistance; stepDistance++) 
            {
                neighborCoords.${inAxis} = blockCoords.${inAxis} ${inSign} stepDistance;
                if (outBounds(neighborCoords.${inAxis})) 
                {
                    break;
                }

                neighborDistance = getDistance(neighborCoords);
                if (stepDistance >= neighborDistance)
                {
                    blockDistance = stepDistance;
                    break;
                }
            }

            setOutput(float(blockDistance));
        }
        `
    }
}
class ExtendedAnisotropicChessDistancesBitpack implements GPGPUProgram 
{
    variableNames = ['DistanceX', 'DistanceY', 'DistanceZ', 'Occupancy']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number]) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

        int getDistanceX(ivec3 coords) { return int(getDistanceX(coords.z, coords.y, coords.x, 0)); }
        int getDistanceY(ivec3 coords) { return int(getDistanceY(coords.z, coords.y, coords.x, 0)); }
        int getDistanceZ(ivec3 coords) { return int(getDistanceZ(coords.z, coords.y, coords.x, 0)); }
        int getOccupancy(ivec3 coords) { return int(getOccupancy(coords.z, coords.y, coords.x, 0)); }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances;

            blockDistances.x = getDistanceX(blockCoords);
            blockDistances.y = getDistanceY(blockCoords);
            blockDistances.z = getDistanceZ(blockCoords);
            blockDistances.a = getOccupancy(blockCoords);

            int packedDistances = 
                clamp(blockDistances.r, 0, 31) * 2048 + 
                clamp(blockDistances.g, 0, 31) * 64 + 
                clamp(blockDistances.b, 0, 31) * 2 + 
                clamp(blockDistances.a, 0,  1) * 1;

            setOutput(float(packedDistances));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    return tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(prog, inputs)) as tf.Tensor4D
}

export function extendedAnisotropicChessDistanceProgram(inputOccupancy: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    // Programs
    const getChessDistanceAlongX0 = new AnisotropicChessDistancePass(shape, 'occupancy', '-x', maxDistance)
    const getChessDistanceAlongX1 = new AnisotropicChessDistancePass(shape, 'occupancy', '+x', maxDistance)
    const getChessDistanceAlongY0 = new AnisotropicChessDistancePass(shape, 'occupancy', '-y', maxDistance)
    const getChessDistanceAlongY1 = new AnisotropicChessDistancePass(shape, 'occupancy', '+y', maxDistance)
    
    const getChessDistanceAlongY0FromXorZ  = new AnisotropicChessDistancePass(shape, 'distance',  '-y', maxDistance)
    const getChessDistanceAlongY1FromXorZ  = new AnisotropicChessDistancePass(shape, 'distance',  '+y', maxDistance)
    const getChessDistanceAlongZ0FromXorY  = new AnisotropicChessDistancePass(shape, 'distance',  '-z', maxDistance)
    const getChessDistanceAlongZ1FromXorY  = new AnisotropicChessDistancePass(shape, 'distance',  '+z', maxDistance)
    
    const getChessDistanceXAlongX0FromYZ = new ExtendedAnisotropicChessDistancePass(shape, '-x', maxDistance)
    const getChessDistanceXAlongX1FromYZ = new ExtendedAnisotropicChessDistancePass(shape, '+x', maxDistance)
    const getChessDistanceYAlongY0FromXZ = new ExtendedAnisotropicChessDistancePass(shape, '-y', maxDistance)
    const getChessDistanceYAlongY1FromXZ = new ExtendedAnisotropicChessDistancePass(shape, '+y', maxDistance)
    const getChessDistanceZAlongZ0FromXY = new ExtendedAnisotropicChessDistancePass(shape, '-z', maxDistance)
    const getChessDistanceZAlongZ1FromXY = new ExtendedAnisotropicChessDistancePass(shape, '+z', maxDistance)

    const getChessDistancesBitpacked = new ExtendedAnisotropicChessDistancesBitpack(shape)

    // 1D
    const chessDistanceOverX0 = runProgram(getChessDistanceAlongX0, [inputOccupancy])
    const chessDistanceOverX1 = runProgram(getChessDistanceAlongX1, [inputOccupancy])
    const chessDistanceOverY0 = runProgram(getChessDistanceAlongY0, [inputOccupancy])
    const chessDistanceOverY1 = runProgram(getChessDistanceAlongY1, [inputOccupancy])

    // 2D
    const chessDistanceOverXY00 = runProgram(getChessDistanceAlongY0FromXorZ, [chessDistanceOverX0]);
    const chessDistanceOverXY01 = runProgram(getChessDistanceAlongY1FromXorZ, [chessDistanceOverX0]); 
    const chessDistanceOverXZ00 = runProgram(getChessDistanceAlongZ0FromXorY, [chessDistanceOverX0]);
    const chessDistanceOverXZ01 = runProgram(getChessDistanceAlongZ1FromXorY, [chessDistanceOverX0]); tf.dispose(chessDistanceOverX0)
    const chessDistanceOverXY10 = runProgram(getChessDistanceAlongY0FromXorZ, [chessDistanceOverX1]);
    const chessDistanceOverXY11 = runProgram(getChessDistanceAlongY1FromXorZ, [chessDistanceOverX1]); 
    const chessDistanceOverXZ10 = runProgram(getChessDistanceAlongZ0FromXorY, [chessDistanceOverX1]);
    const chessDistanceOverXZ11 = runProgram(getChessDistanceAlongZ1FromXorY, [chessDistanceOverX1]); tf.dispose(chessDistanceOverX1)
    const chessDistanceOverYZ00 = runProgram(getChessDistanceAlongZ0FromXorY, [chessDistanceOverY0]);
    const chessDistanceOverYZ01 = runProgram(getChessDistanceAlongZ1FromXorY, [chessDistanceOverY0]); tf.dispose(chessDistanceOverY0)
    const chessDistanceOverYZ10 = runProgram(getChessDistanceAlongZ0FromXorY, [chessDistanceOverY1]);
    const chessDistanceOverYZ11 = runProgram(getChessDistanceAlongZ1FromXorY, [chessDistanceOverY1]); tf.dispose(chessDistanceOverY1)

    // 3D
    const chessDistanceXOverXYZ000 = runProgram(getChessDistanceXAlongX0FromYZ, [chessDistanceOverYZ00]);
    const chessDistanceXOverXYZ100 = runProgram(getChessDistanceXAlongX1FromYZ, [chessDistanceOverYZ00]); tf.dispose(chessDistanceOverYZ00)
    const chessDistanceXOverXYZ001 = runProgram(getChessDistanceXAlongX0FromYZ, [chessDistanceOverYZ01]);
    const chessDistanceXOverXYZ101 = runProgram(getChessDistanceXAlongX1FromYZ, [chessDistanceOverYZ01]); tf.dispose(chessDistanceOverYZ01)
    const chessDistanceXOverXYZ010 = runProgram(getChessDistanceXAlongX0FromYZ, [chessDistanceOverYZ10]);
    const chessDistanceXOverXYZ110 = runProgram(getChessDistanceXAlongX1FromYZ, [chessDistanceOverYZ10]); tf.dispose(chessDistanceOverYZ10)
    const chessDistanceXOverXYZ011 = runProgram(getChessDistanceXAlongX0FromYZ, [chessDistanceOverYZ11]);
    const chessDistanceXOverXYZ111 = runProgram(getChessDistanceXAlongX1FromYZ, [chessDistanceOverYZ11]); tf.dispose(chessDistanceOverYZ11)
    const chessDistanceYOverXYZ000 = runProgram(getChessDistanceYAlongY0FromXZ, [chessDistanceOverXZ00]);
    const chessDistanceYOverXYZ010 = runProgram(getChessDistanceYAlongY1FromXZ, [chessDistanceOverXZ00]); tf.dispose(chessDistanceOverXZ00)
    const chessDistanceYOverXYZ001 = runProgram(getChessDistanceYAlongY0FromXZ, [chessDistanceOverXZ01]);
    const chessDistanceYOverXYZ011 = runProgram(getChessDistanceYAlongY1FromXZ, [chessDistanceOverXZ01]); tf.dispose(chessDistanceOverXZ01)
    const chessDistanceYOverXYZ100 = runProgram(getChessDistanceYAlongY0FromXZ, [chessDistanceOverXZ10]);
    const chessDistanceYOverXYZ110 = runProgram(getChessDistanceYAlongY1FromXZ, [chessDistanceOverXZ10]); tf.dispose(chessDistanceOverXZ10)
    const chessDistanceYOverXYZ101 = runProgram(getChessDistanceYAlongY0FromXZ, [chessDistanceOverXZ11]);
    const chessDistanceYOverXYZ111 = runProgram(getChessDistanceYAlongY1FromXZ, [chessDistanceOverXZ11]); tf.dispose(chessDistanceOverXZ11)
    const chessDistanceZOverXYZ000 = runProgram(getChessDistanceZAlongZ0FromXY, [chessDistanceOverXY00]);
    const chessDistanceZOverXYZ001 = runProgram(getChessDistanceZAlongZ1FromXY, [chessDistanceOverXY00]); tf.dispose(chessDistanceOverXY00)
    const chessDistanceZOverXYZ010 = runProgram(getChessDistanceZAlongZ0FromXY, [chessDistanceOverXY01]);
    const chessDistanceZOverXYZ011 = runProgram(getChessDistanceZAlongZ1FromXY, [chessDistanceOverXY01]); tf.dispose(chessDistanceOverXY01)
    const chessDistanceZOverXYZ100 = runProgram(getChessDistanceZAlongZ0FromXY, [chessDistanceOverXY10]);
    const chessDistanceZOverXYZ101 = runProgram(getChessDistanceZAlongZ1FromXY, [chessDistanceOverXY10]); tf.dispose(chessDistanceOverXY10)
    const chessDistanceZOverXYZ110 = runProgram(getChessDistanceZAlongZ0FromXY, [chessDistanceOverXY11]);
    const chessDistanceZOverXYZ111 = runProgram(getChessDistanceZAlongZ1FromXY, [chessDistanceOverXY11]); tf.dispose(chessDistanceOverXY11)

    // Packing
    const chessDistancesXYZOverXYZ000 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ000, chessDistanceYOverXYZ000, chessDistanceZOverXYZ000, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ000, chessDistanceYOverXYZ000, chessDistanceZOverXYZ000])
    const chessDistancesXYZOverXYZ001 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ001, chessDistanceYOverXYZ001, chessDistanceZOverXYZ001, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ001, chessDistanceYOverXYZ001, chessDistanceZOverXYZ001])
    const chessDistancesXYZOverXYZ010 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ010, chessDistanceYOverXYZ010, chessDistanceZOverXYZ010, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ010, chessDistanceYOverXYZ010, chessDistanceZOverXYZ010])
    const chessDistancesXYZOverXYZ011 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ011, chessDistanceYOverXYZ011, chessDistanceZOverXYZ011, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ011, chessDistanceYOverXYZ011, chessDistanceZOverXYZ011])
    const chessDistancesXYZOverXYZ100 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ100, chessDistanceYOverXYZ100, chessDistanceZOverXYZ100, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ100, chessDistanceYOverXYZ100, chessDistanceZOverXYZ100])
    const chessDistancesXYZOverXYZ101 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ101, chessDistanceYOverXYZ101, chessDistanceZOverXYZ101, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ101, chessDistanceYOverXYZ101, chessDistanceZOverXYZ101])
    const chessDistancesXYZOverXYZ110 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ110, chessDistanceYOverXYZ110, chessDistanceZOverXYZ110, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ110, chessDistanceYOverXYZ110, chessDistanceZOverXYZ110])
    const chessDistancesXYZOverXYZ111 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ111, chessDistanceYOverXYZ111, chessDistanceZOverXYZ111, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ111, chessDistanceYOverXYZ111, chessDistanceZOverXYZ111])

    // Concatenate 
    const chessDistancesXYZOverXYZ = tf.concat([
        chessDistancesXYZOverXYZ000,
        chessDistancesXYZOverXYZ100,
        chessDistancesXYZOverXYZ010,
        chessDistancesXYZOverXYZ110,
        chessDistancesXYZOverXYZ001,
        chessDistancesXYZOverXYZ101,
        chessDistancesXYZOverXYZ011,
        chessDistancesXYZOverXYZ111,
    ], 0)

    tf.dispose([
        chessDistancesXYZOverXYZ000,
        chessDistancesXYZOverXYZ100,
        chessDistancesXYZOverXYZ010,
        chessDistancesXYZOverXYZ110,
        chessDistancesXYZOverXYZ001,
        chessDistancesXYZOverXYZ101,
        chessDistancesXYZOverXYZ011,
        chessDistancesXYZOverXYZ111,
    ])
            
    return chessDistancesXYZOverXYZ
}
