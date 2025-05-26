export default [     
    
    // Colormaps
    {
        name: 'colorMaps',
        type: 'texture',
        path: 'textures/colormaps/colormaps.png',
    },

    // NIFTI    
    {
        name: 'intensityMap',
        type: 'niftiFile',
        path: 'nifti/colon/volume.nii.gz',
        // path: 'nifti/cardiac/mr_train_1001_image.nii.gz',
        // path: 'nifti/cardiac/mr_train_1014_image.nii.gz',
        // path: 'nifti/cardiac/ct_train_1001_image.nii.gz',
        // path: 'nifti/cardiac/ct_train_1002_image.nii.gz',
    }, 
]