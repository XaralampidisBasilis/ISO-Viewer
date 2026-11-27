import * as tf from '@tensorflow/tfjs'

/**
 * Convert float32 samples with round-to-nearest, ties-to-even semantics.
 *
 * @param {Float32Array} values - Source samples.
 * @returns {Uint16Array} Binary16 words, with signed zeros preserved and NaNs canonicalized by the software path.
 */
export function float32ToHalfBits(values)
{
    if (typeof Float16Array === 'function')
    {
        const half = new Float16Array(values)
        return new Uint16Array(half.buffer, half.byteOffset, half.length)
    }

    const words = new Uint32Array(values.buffer, values.byteOffset, values.length)
    const result = new Uint16Array(words.length)
    for (let i = 0; i < words.length; i++)
    {
        const word = words[i]
        const sign = (word >>> 16) & 0x8000
        const exponent = ((word >>> 23) & 0xff) - 127
        const fraction = word & 0x7fffff
        if (exponent > 15)
        {
            result[i] = sign | (exponent === 128 && fraction ? 0x7e00 : 0x7c00)
        }
        // At exponent -25, values above the midpoint round to the smallest subnormal.
        else if (exponent >= -25)
        {
            const subnormal = exponent < -14
            const shift = subnormal ? -exponent - 1 : 13
            const significand = subnormal ? fraction | 0x800000 : fraction
            const base = subnormal ? 0 : (exponent + 15) << 10
            // Round to nearest, with ties to even. A carry can increment the exponent.
            const bias = (1 << (shift - 1)) - 1 + ((significand >>> shift) & 1)
            result[i] = sign | (base + ((significand + bias) >>> shift))
        }
        else result[i] = sign
    }
    return result
}

/**
 * Synchronously read a feature tensor into words ready for a half-float texture upload.
 *
 * @param {import("@tensorflow/tfjs").Tensor} features - Float32 samples to read. Ownership stays with the caller.
 * @param {function(import("@tensorflow/tfjs").Tensor): import("@tensorflow/tfjs").Tensor} encode - GPU encoder for the tensor layout.
 * @returns {Uint16Array} Half-float bits in tensor storage order.
 */
export default function readHalfFloatBits(features, encode)
{
    // Prefer native conversion. The CPU fallback avoids storing integer words in a float16 render target.
    if (typeof Float16Array === 'function' || !tf.env().getBool('WEBGL_RENDER_FLOAT32_ENABLED'))
        return float32ToHalfBits(features.dataSync())

    const tensor = encode(features)
    try
    {
        return new Uint16Array(tensor.dataSync())
    }
    finally
    {
        tensor.dispose()
    }
}
