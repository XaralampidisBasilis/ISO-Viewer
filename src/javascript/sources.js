import preview from '../../static/nifti/head/CTA-Head-and-Neck-preview.nii.gz?url'
import detail from '../../static/nifti/head/CTA-Head-and-Neck.nii.gz?url'

// The bundled scan uses stored values from 0 to 4095. Both grids share this range.
export const intensityRange = [0, 4095]

export default {
    preview: { path: preview, factor: 1 },
    detail: { path: detail, factor: 0.8 },
}
