import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class GPGPUResizeMap implements GPGPUProgram 
{
    variableNames = ['Input']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        outputSize: [number, number, number],
        alignCorners: boolean,
        halfPixelCenters: boolean
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        const [newDepth, newHeight, newWidth] = outputSize
        this.outputShape = [newDepth, newHeight, newWidth]

        const effectiveInSize = [
            alignCorners && newDepth  > 1 ? inDepth  - 1 : inDepth,
            alignCorners && newHeight > 1 ? inHeight - 1 : inHeight,
            alignCorners && newWidth  > 1 ? inWidth  - 1 : inWidth
        ];
        const effectiveOutSize = [
            alignCorners && newDepth  > 1 ? newDepth  - 1 : newDepth,
            alignCorners && newHeight > 1 ? newHeight - 1 : newHeight,
            alignCorners && newWidth  > 1 ? newWidth  - 1 : newWidth
        ];

        const scaleFactors = effectiveInSize.map((inSize, i) => inSize / effectiveOutSize[i])

        const sourceFracIndex = halfPixelCenters
        ? `(vec3(coords) + vec3(0.5)) * scaleFactors - vec3(0.5)`
        : `vec3(coords) * scaleFactors`

        this.userCode = `
        // Logical shapes (not texture sizes)
        const vec3 inShape  = vec3(${inDepth}, ${inHeight}, ${inWidth});
        const ivec3 outShape = ivec3(${newDepth}, ${newHeight}, ${newWidth});

        // Scale factors from output index -> input index
        const vec3 scaleFactors = vec3(${scaleFactors[0]}, ${scaleFactors[1]}, ${scaleFactors[2]});

        // Map an output logical coord to the source fractional coord
        vec3 outToSrcFrac(ivec3 oc) 
        {
            vec3 o = vec3(oc);
            ${halfPixelCenters
            ? `return (o + vec3(0.5)) * scaleFactors - vec3(0.5);`
            : `return o * scaleFactors;`
            }
        }

        // Trilinear sample at a given *output* logical coord (we convert to input coords inside)
        float triAtOut(ivec3 oc) 
        {
            vec3 s = outToSrcFrac(oc);

            // clamp within input volume
            vec3 f = clamp(floor(s), vec3(0.0), inShape - 1.0);
            vec3 c = clamp( ceil(s), vec3(0.0), inShape - 1.0);
            vec3 t = s - f;  // fractional part

            float c000 = getInput(int(f.x), int(f.y), int(f.z));
            float c001 = getInput(int(f.x), int(f.y), int(c.z));
            float c010 = getInput(int(f.x), int(c.y), int(f.z));
            float c011 = getInput(int(f.x), int(c.y), int(c.z));
            float c100 = getInput(int(c.x), int(f.y), int(f.z));
            float c101 = getInput(int(c.x), int(f.y), int(c.z));
            float c110 = getInput(int(c.x), int(c.y), int(f.z));
            float c111 = getInput(int(c.x), int(c.y), int(c.z));

            float c00 = mix(c000, c001, t.z);
            float c01 = mix(c010, c011, t.z);
            float c10 = mix(c100, c101, t.z);
            float c11 = mix(c110, c111, t.z);

            float c0 = mix(c00, c01, t.y);
            float c1 = mix(c10, c11, t.y);

            return mix(c0, c1, t.x);
        }

        void main() 
        {
            // Packed output coordinates: each invocation writes a 2x2 tile in (H,W)
            ivec3 rc = getOutputCoords();   // (d, yBlock, zBlock)

            int d  = rc.x;
            int y0 = rc.y * 2;
            int z0 = rc.z * 2;

            // Bounds (odd sizes produce partial tiles at the right/bottom edges)
            bool y1In = (y0 + 1) < outShape.y;
            bool z1In = (z0 + 1) < outShape.z;

            float v00 = triAtOut(ivec3(d, y0,     z0    ));
            float v01 = z1In ? triAtOut(ivec3(d, y0,     z0 + 1)) : v00;   // replicate edge
            float v10 = y1In ? triAtOut(ivec3(d, y0 + 1, z0    )) : v00;
            float v11 = (y1In && z1In) ? triAtOut(ivec3(d, y0 + 1, z0 + 1)) : v00;

            // Write the packed RGBA (top-left, top-right, bottom-left, bottom-right)
            setOutput(vec4(v00, v01, v10, v11));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]): tf.Tensor
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor
}

export function computeResizedMap
(
    inputTensor: tf.Tensor3D, 
    outputSize: [number, number, number], 
    alignCorners = false, 
    halfPixelCenters = false
): tf.Tensor 
{
    const program = new GPGPUResizeMap(inputTensor.shape, outputSize, alignCorners, halfPixelCenters);
    return runProgram(program, [inputTensor]) as tf.Tensor3D;
}