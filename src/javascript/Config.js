/**
 * Default configuration for ISO-Viewer
 */

export const DEFAULT_OPTIONS = {
    sources: [
        {
            name: 'volume',
            type: 'niftiFile',
            path: 'nifti/cardiac/ct_train_1002_image.nii.gz',
        },
    ],
}

/**
 * Get default sources from URL parameters
 * e.g., ?niftiPath=https://example.com/file.nii.gz
 */
export function getSourcesFromUrl() 
{
    const params = new URLSearchParams(window.location.search)
    const niftiPath = params.get('niftiPath')
    
    if (niftiPath) 
    {
        return [
            {
                name: 'volume',
                type: 'niftiFile',
                path: niftiPath,
            },
        ]
    }

    return DEFAULT_OPTIONS.sources
}

export default DEFAULT_OPTIONS
