import { FileLoader, Loader } from 'three'
import { Volume } from 'three/examples/jsm/misc/Volume'
import * as nifti from 'nifti-reader-js'

const voxelTypes = {
    [nifti.NIFTI1.TYPE_UINT8]: Uint8Array,
    [nifti.NIFTI1.TYPE_INT8]: Int8Array,
    [nifti.NIFTI1.TYPE_UINT16]: Uint16Array,
    [nifti.NIFTI1.TYPE_INT16]: Int16Array,
    [nifti.NIFTI1.TYPE_UINT32]: Uint32Array,
    [nifti.NIFTI1.TYPE_INT32]: Int32Array,
    [nifti.NIFTI1.TYPE_FLOAT32]: Float32Array,
    [nifti.NIFTI1.TYPE_FLOAT64]: Float64Array,
}

const nativeLittleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1

class NIFTILoader extends Loader
{
    load(url, onLoad, onProgress, onError)
    {
        const loader = new FileLoader(this.manager)
        loader.setPath(this.path)
        loader.setResponseType('arraybuffer')
        loader.setRequestHeader(this.requestHeader)
        loader.setWithCredentials(this.withCredentials)
        loader.load(url, data => {
            try
            {
                onLoad(this.parse(data))
            }
            catch (error)
            {
                if (onError) onError(error)
                else console.error(error)
                this.manager.itemError(url)
            }
        }, onProgress, onError)
    }

    parse(data)
    {
        if (data.byteLength < 2) throw new Error('The NIfTI file is empty or incomplete.')
        if (nifti.isCompressed(data)) data = nifti.decompress(data)
        if (!nifti.isNIFTI(data)) throw new Error('Choose a single-file NIfTI scan (.nii or .nii.gz).')

        const header = nifti.readHeader(data)
        const dimensions = header.dims.slice(1, 4)
        if (header.dims[0] < 3 || header.dims[0] > 7 ||
            dimensions.some(size => !Number.isSafeInteger(size) || size < 1) ||
            header.dims.slice(4, header.dims[0] + 1).some(size => size > 1))
            throw new Error('The viewer needs one 3D scalar volume.')

        const ArrayType = voxelTypes[header.datatypeCode]
        if (!ArrayType || header.numBitsPerVoxel !== 8 * ArrayType.BYTES_PER_ELEMENT)
            throw new Error('This NIfTI voxel type is unsupported.')

        const voxelBytes = dimensions.reduce((count, size) => count * size, ArrayType.BYTES_PER_ELEMENT)
        const offset = header.vox_offset
        const headerBytes = header instanceof nifti.NIFTI2 ? 544 : 352
        if (!Number.isSafeInteger(voxelBytes) || !Number.isSafeInteger(offset) ||
            offset < headerBytes || voxelBytes > data.byteLength - offset)
            throw new Error('The NIfTI file has an incomplete or invalid voxel payload.')

        const image = data.slice(offset, offset + voxelBytes)
        if (header.littleEndian !== nativeLittleEndian && ArrayType.BYTES_PER_ELEMENT > 1)
        {
            const bytes = new Uint8Array(image)
            const stride = ArrayType.BYTES_PER_ELEMENT
            for (let start = 0; start < bytes.length; start += stride)
                for (let i = 0; i < stride / 2; i++)
                {
                    const left = start + i
                    const right = start + stride - 1 - i
                    const byte = bytes[left]
                    bytes[left] = bytes[right]
                    bytes[right] = byte
                }
        }

        const units = header.getUnitsCodeString(nifti.NIFTI1.SPATIAL_UNITS_MASK & header.xyzt_units)
        const unitScale = { Meters: 1, Millimeters: 1e-3, Microns: 1e-6 }[units] ?? 1e-3
        const spacing = header.pixDims.slice(1, 4).map(value => value * unitScale)
        if (spacing.some(value => !Number.isFinite(value) || value <= 0))
            throw new Error('The NIfTI voxel spacing is invalid.')

        const volume = new Volume()
        volume.header = header
        volume.data = new ArrayType(image)
        if ((ArrayType === Float32Array || ArrayType === Float64Array) &&
            volume.data.some(value => !Number.isFinite(Math.fround(value))))
            throw new Error('The NIfTI scan contains invalid floating-point voxel values.')

        volume.dimensions = dimensions
        volume.spacing = spacing
        volume.spatialUnits = 'Meters'
        volume.size = dimensions.map((size, axis) => size * spacing[axis])
        volume.xLength = dimensions[0]
        volume.yLength = dimensions[1]
        volume.zLength = dimensions[2]
        return volume
    }
}

export { NIFTILoader }
