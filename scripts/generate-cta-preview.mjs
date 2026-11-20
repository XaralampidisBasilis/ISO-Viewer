import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync, gunzipSync } from 'node:zlib'

const folder = new URL('../static/nifti/head/', import.meta.url)
const source = gunzipSync(readFileSync(new URL('CTA-Head-and-Neck.nii.gz', folder)))
if (source.readInt32LE(0) !== 348 || source.readInt16LE(40) !== 3 || source.readInt16LE(70) !== 4)
    throw new Error('Expected the bundled 3D little-endian int16 NIfTI-1 scan.')

const dimensions = [0, 1, 2].map(axis => source.readInt16LE(42 + 2 * axis))
const previewDimensions = dimensions.map(size => Math.ceil(size / 2))
const scales = dimensions.map((size, axis) => size / previewDimensions[axis])
const offset = source.readFloatLE(108)
const preview = Buffer.alloc(offset + 2 * previewDimensions.reduce((count, size) => count * size, 1))
source.copy(preview, 0, 0, offset)

// Keep the physical extent and the voxel-center mapping used by the viewer's resampler.
for (let axis = 0; axis < 3; axis++)
{
    preview.writeInt16LE(previewDimensions[axis], 42 + 2 * axis)
    preview.writeFloatLE(source.readFloatLE(80 + 4 * axis) * scales[axis], 80 + 4 * axis)
}

// The source sform carries the same orientation as its qform. Keep the resampled sform.
preview.writeInt16LE(0, 252)
for (let row = 0; row < 3; row++)
{
    const start = 280 + 16 * row
    let translation = source.readFloatLE(start + 12)
    for (let axis = 0; axis < 3; axis++)
    {
        const coefficient = source.readFloatLE(start + 4 * axis)
        preview.writeFloatLE(coefficient * scales[axis], start + 4 * axis)
        translation += coefficient * (scales[axis] - 1) / 2
    }
    preview.writeFloatLE(translation, start + 12)
}

function samples(axis)
{
    return Array.from({ length: previewDimensions[axis] }, (_, index) => {
        const position = (index + 0.5) * scales[axis] - 0.5
        return [Math.floor(position), Math.ceil(position), position % 1]
    })
}

const [xs, ys, zs] = [0, 1, 2].map(samples)
const strideY = dimensions[0]
const strideZ = dimensions[0] * dimensions[1]
const voxel = (x, y, z) => source.readInt16LE(offset + 2 * (z * strideZ + y * strideY + x))
const mix = (a, b, fraction) => a + (b - a) * fraction
let index = offset
for (const [z0, z1, fz] of zs)
    for (const [y0, y1, fy] of ys)
        for (const [x0, x1, fx] of xs)
        {
            const lower = mix(mix(voxel(x0, y0, z0), voxel(x1, y0, z0), fx), mix(voxel(x0, y1, z0), voxel(x1, y1, z0), fx), fy)
            const upper = mix(mix(voxel(x0, y0, z1), voxel(x1, y0, z1), fx), mix(voxel(x0, y1, z1), voxel(x1, y1, z1), fx), fy)
            preview.writeInt16LE(Math.round(mix(lower, upper, fz)), index)
            index += 2
        }

const compressed = gzipSync(preview, { level: 9 })
writeFileSync(new URL('CTA-Head-and-Neck-preview.nii.gz', folder), compressed)
console.log(`${previewDimensions.join(' × ')} voxels, ${(compressed.length / 2 ** 20).toFixed(1)} MiB`)
