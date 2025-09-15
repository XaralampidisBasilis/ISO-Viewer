import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'


class FirstExtendedAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputOccupancies']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        maxDistance: number,
    ) 
    {
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inWidth-1))};
        
        vec4 getInputOccupancies(ivec3 coords) { return getInputOccupancies(coords.z, coords.y, coords.x); }

        vec4 getInputDistances(ivec3 coords) { return step(getInputOccupancies(coords), vec4(0.5)) * vec4(${maxDistance}); }

        bool insideWidth(int x) { return x >= 0 && x <= ${inWidth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = outputCoords.xyz;

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;
            
            int sign = (outputCoords.w < 1) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rb = vec2(0 - sign);
                stepDistances.ga = vec2(0);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                candidateDistances.rb = neighborDistances.rb;
            }
            else
            {
                stepDistances.rb = vec2(0);
                stepDistances.ga = vec2(0 + sign);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ga = neighborDistances.ga;
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }
            
            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.x = outputCoords.x + stepDistance * sign;
                if (insideWidth(inputCoords.x)) 
                {                    
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rb = vec2(stepDistance - sign);
                    stepDistances.ga = vec2(stepDistance);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga); 

                    stepDistances.rb = vec2(stepDistance);
                    stepDistances.ga = vec2(stepDistance + sign);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class FirstExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputOccupancies']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        maxDistance: number,
    ) 
    {
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inDepth, inHeight, inWidth] = inputShape; 
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inHeight-1))};
        
        vec4 getInputOccupancies(ivec3 coords) { return getInputOccupancies(coords.z, coords.y, coords.x); }

        vec4 getInputDistances(ivec3 coords) { return step(getInputOccupancies(coords), vec4(0.5)) * vec4(${maxDistance}); }

        bool insideHeight(int y) { return y >= 0 && y <= ${inHeight-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = outputCoords.xyz;    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 1) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rg = vec2(0 - sign);
                stepDistances.ba = vec2(0);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            }
            else
            {
                stepDistances.rg = vec2(0);
                stepDistances.ba = vec2(0 + sign);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.y = outputCoords.y + stepDistance * sign;
                if (insideHeight(inputCoords.y)) 
                {   
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rg = vec2(stepDistance - sign);
                    stepDistances.ba = vec2(stepDistance);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                    stepDistances.rg = vec2(stepDistance);
                    stepDistances.ba = vec2(stepDistance + sign);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class FirstExtendedAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputOccupancies']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.min(maxDistance, inDepth-1)};

        vec4 getInputOccupancies(ivec3 coords) { return getInputOccupancies(coords.z, coords.y, coords.x); }

        vec4 getInputDistances(ivec3 coords) { return step(getInputOccupancies(coords), vec4(0.5)) * vec4(${maxDistance}); }

        bool insideDepth(int z) { return z >= 0 && z <= ${inDepth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = outputCoords.xyz;

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 1) ? -1 : 1;

            for (int stepDistance = 0; stepDistance <= maxSteps; stepDistance++) 
            {
                inputCoords.z = outputCoords.z + stepDistance * sign;
                if (insideDepth(inputCoords.z))
                {
                    inputDistances = getInputDistances(inputCoords);

                    candidateDistances = max(inputDistances, vec4(stepDistance));
                    outputDistances = min(outputDistances, candidateDistances);

                    if (mmax(outputDistances) < float(stepDistance + 1)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class SecondExtendedAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inBatches, inDepth, inHeight, inWidth] = inputShape;  if (inBatches != 2) throw new Error('Batch dimension needs to be 2');
        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inWidth-1))};
        
        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        bool insideWidth(int x) { return x >= 0 && x <= ${inWidth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 2);    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 2) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rb = vec2(0 - sign);
                stepDistances.ga = vec2(0);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                candidateDistances.rb = neighborDistances.rb;
            }
            else
            {
                stepDistances.rb = vec2(0);
                stepDistances.ga = vec2(0 + sign);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ga = neighborDistances.ga;
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.x = outputCoords.x + stepDistance * sign;
                if (insideWidth(inputCoords.x)) 
                {   
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rb = vec2(stepDistance - sign);
                    stepDistances.ga = vec2(stepDistance);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);

                    stepDistances.rb = vec2(stepDistance);
                    stepDistances.ga = vec2(stepDistance + sign);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class SecondExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inBatches, inDepth, inHeight, inWidth] = inputShape;  if (inBatches != 2) throw new Error('Batch dimension needs to be 2');
        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inHeight-1))};
        
        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        bool insideHeight(int y) { return y >= 0 && y <= ${inHeight-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 2);    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 2) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rg = vec2(0 - sign);
                stepDistances.ba = vec2(0);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            }
            else
            {
                stepDistances.rg = vec2(0);
                stepDistances.ba = vec2(0 + sign);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.y = outputCoords.y + stepDistance * sign;
                if (insideHeight(inputCoords.y)) 
                {   
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rg = vec2(stepDistance - sign);
                    stepDistances.ba = vec2(stepDistance);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                    stepDistances.rg = vec2(stepDistance);
                    stepDistances.ba = vec2(stepDistance + sign);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class SecondExtendedAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatches, inDepth, inHeight, inWidth] = inputShape;  if (inBatches != 2) throw new Error('Batch dimension needs to be 2');
        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.min(maxDistance, inDepth-1)};

        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        bool insideDepth(int z) { return z >= 0 && z <= ${inDepth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 2);    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 2) ? -1 : 1;

            for (int stepDistance = 0; stepDistance <= maxSteps; stepDistance++) 
            {
                inputCoords.z = outputCoords.z + stepDistance * sign;
                if (insideDepth(inputCoords.z))
                {
                    inputDistances = getInputDistances(inputCoords);
                    stepDistances = vec4(stepDistance);

                    candidateDistances = max(inputDistances, stepDistances);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 1)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class ThirdExtendedAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {        
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inBatch, inDepth, inHeight, inWidth] = inputShape; if (inBatch != 4) throw new Error('Batch dimension needs to be 4');
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inWidth-1))};

        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        bool insideWidth(int x) { return x >= 0 && x <= ${inWidth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborOccupancies, neighborDistances, candidateDistances;
            
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 4);

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = vec4(${maxDistance});
            
            int sign = ((outputCoords.w % 2) < 1) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rb = vec2(0 - sign);
                stepDistances.ga = vec2(0);

                neighborOccupancies = step(inputDistances, stepDistances);
                neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);

                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                candidateDistances.rb = neighborDistances.rb;
            }
            else
            {
                stepDistances.rb = vec2(0);
                stepDistances.ga = vec2(0 + sign);

                neighborOccupancies = step(inputDistances, stepDistances);
                neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);

                candidateDistances.ga = neighborDistances.ga;
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.x = outputCoords.x + stepDistance * sign;
                if (insideWidth(inputCoords.x))
                {
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rb = vec2(stepDistance - sign);
                    stepDistances.ga = vec2(stepDistance);

                    neighborOccupancies = step(inputDistances, stepDistances);
                    neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    stepDistances.rb = vec2(stepDistance);
                    stepDistances.ga = vec2(stepDistance + sign);

                    neighborOccupancies = step(inputDistances, stepDistances);
                    neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);

                    outputDistances = min(outputDistances, candidateDistances);

                    if (mmax(outputDistances) < float(stepDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class ThirdExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {        
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inBatch, inDepth, inHeight, inWidth] = inputShape; if (inBatch != 4) throw new Error('Batch dimension needs to be 4');
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inHeight-1))};

        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        bool insideHeight(int y) { return y >= 0 && y <= ${inHeight-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborOccupancies, neighborDistances, candidateDistances;
            
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 4);

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = vec4(${maxDistance});
            
            int sign = ((outputCoords.w % 4) < 2) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rg = vec2(0 - sign);
                stepDistances.ba = vec2(0);

                neighborOccupancies = step(inputDistances, stepDistances);
                neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            }
            else
            {
                stepDistances.rg = vec2(0);
                stepDistances.ba = vec2(0 + sign);

                neighborOccupancies = step(inputDistances, stepDistances);
                neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);

                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.y = outputCoords.y + stepDistance * sign;
                if (insideHeight(inputCoords.y))
                {
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rg = vec2(stepDistance - sign);
                    stepDistances.ba = vec2(stepDistance);

                    neighborOccupancies = step(inputDistances, stepDistances);
                    neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);

                    stepDistances.rg = vec2(stepDistance);
                    stepDistances.ba = vec2(stepDistance + sign);

                    neighborOccupancies = step(inputDistances, stepDistances);
                    neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                    outputDistances = min(outputDistances, candidateDistances);

                    if (mmax(outputDistances) < float(stepDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class ThirdExtendedAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape;  if (inBatch != 4) throw new Error('Batch dimension needs to be 4')
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.min(maxDistance, inDepth-1)};

        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        bool insideDepth(int z) { return z >= 0 && z <= ${inDepth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, candidateOccupancies, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 4);    

            vec4 outputDistances = vec4(${maxDistance});
            vec4 inputDistances;

            int sign = ((outputCoords.w % 8) < 4) ? -1 : 1;
            
            for (int stepDistance = 0; stepDistance <= maxSteps; stepDistance++) 
            {
                inputCoords.z = outputCoords.z + stepDistance * sign;
                if (insideDepth(inputCoords.z))
                {
                    inputDistances = getInputDistances(inputCoords);
                    stepDistances = vec4(stepDistance);

                    candidateOccupancies = step(inputDistances, stepDistances);
                    candidateDistances = mix(outputDistances, stepDistances, candidateOccupancies);

                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 1)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class FourthExtendedAnisotropicChessDistancePassXYZ implements GPGPUProgram 
{
    variableNames = ['InputDistancesX', 'InputDistancesY', 'InputDistancesZ']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor(inputShape: [number, number, number, number]) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape; if (inBatch != 8) throw new Error('Batch dimension needs to be 8')
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `

        vec4 getInputDistancesX(ivec4 coords) { return floor(getInputDistancesX(coords.w, coords.z, coords.y, coords.x) + 0.5); }
        vec4 getInputDistancesY(ivec4 coords) { return floor(getInputDistancesY(coords.w, coords.z, coords.y, coords.x) + 0.5); }
        vec4 getInputDistancesZ(ivec4 coords) { return floor(getInputDistancesZ(coords.w, coords.z, coords.y, coords.x) + 0.5); }

        ivec4 mmin(ivec4 x, ivec4 y, ivec4 z) { return min(min(x, y), z); }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = outputCoords;

            ivec4 inputDistancesX = ivec4(getInputDistancesX(inputCoords));
            ivec4 inputDistancesY = ivec4(getInputDistancesY(inputCoords));
            ivec4 inputDistancesZ = ivec4(getInputDistancesZ(inputCoords));

            ivec4 inputDistances = mmin(inputDistancesX, inputDistancesY, inputDistancesZ);
            ivec4 inputOccupancies = ivec4(lessThan(inputDistances, ivec4(1)));
    
            ivec4 outputDistances = 
                0 * clamp(inputDistancesX,  0, 31) * 2048 + 
                0 * clamp(inputDistancesY,  0, 31) * 64   + 
                1 * clamp(inputDistancesZ,  0, 31) * 2    + 
                0 * clamp(inputOccupancies, 0,  1) * 1;

            setOutput(vec4(outputDistances));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor 
{
    const backend = tf.backend() as MathBackendWebGL
    return tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(prog, inputs))
}

export function extendedAnisotropicChessDistanceProgramPacked(inputOccupancy: tf.Tensor3D, maxDistance: number): tf.Tensor4D 
{
    // 1D 
    const firstPassX = new FirstExtendedAnisotropicChebyshevDistancePassX(inputOccupancy.shape, maxDistance)
    const firstPassY = new FirstExtendedAnisotropicChebyshevDistancePassY(inputOccupancy.shape, maxDistance)
    const distance_X0_X1 = runProgram(firstPassX, [inputOccupancy]) as tf.Tensor4D
    const distance_Y0_Y1 = runProgram(firstPassY, [inputOccupancy]) as tf.Tensor4D

    // 2D
    const secondPassY = new SecondExtendedAnisotropicChebyshevDistancePassY(distance_X0_X1.shape, maxDistance)
    const distance_XY00_XY10_XY01_XY11 = runProgram(secondPassY, [distance_X0_X1]) as tf.Tensor4D; 
    
    const secondPassZ = new SecondExtendedAnisotropicChebyshevDistancePassZ(distance_Y0_Y1.shape, maxDistance)
    const distance_XZ00_XZ10_XZ01_XZ11 = runProgram(secondPassZ, [distance_X0_X1]) as tf.Tensor4D
    tf.dispose(distance_X0_X1)
    
    const distance_YZ00_YZ10_YZ01_YZ11 = runProgram(secondPassZ, [distance_Y0_Y1]) as tf.Tensor4D
    tf.dispose(distance_Y0_Y1)

    // 3D
    const thirdPassX = new ThirdExtendedAnisotropicChebyshevDistancePassX(distance_YZ00_YZ10_YZ01_YZ11.shape, maxDistance)
    const distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassX, [distance_YZ00_YZ10_YZ01_YZ11]) as tf.Tensor4D
    tf.dispose(distance_YZ00_YZ10_YZ01_YZ11)

    const thirdPassY = new ThirdExtendedAnisotropicChebyshevDistancePassY(distance_XZ00_XZ10_XZ01_XZ11.shape, maxDistance)
    const distanceY_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassY, [distance_XZ00_XZ10_XZ01_XZ11]) as tf.Tensor4D 
    tf.dispose(distance_XZ00_XZ10_XZ01_XZ11)
    
    const thirdPassZ = new ThirdExtendedAnisotropicChebyshevDistancePassZ(distance_XY00_XY10_XY01_XY11.shape, maxDistance)
    const distanceZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassZ, [distance_XY00_XY10_XY01_XY11]) as tf.Tensor4D
    tf.dispose(distance_XY00_XY10_XY01_XY11)

    // Pack
    const fourthPassXYZ = new FourthExtendedAnisotropicChessDistancePassXYZ(distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111.shape)
    const distancesXYZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(fourthPassXYZ, [
        distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceY_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
    ]) as tf.Tensor4D
    tf.dispose([
        distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceY_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
    ])

    return distancesXYZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111
}
