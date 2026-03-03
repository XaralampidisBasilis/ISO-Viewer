const defaultVolumePath = 'nifti/cardiac/ct_train_1002_image.nii.gz'

function getVolumeUrlFromSearch(search)
{
    return new URLSearchParams(search).get('volumeUrl')
}

export default function createSources()
{
    const volumeUrlFromViewerUrl = getVolumeUrlFromSearch(window.location.search)
    let volumeUrlFromParentUrl = null

    if (!volumeUrlFromViewerUrl)
    {
        try
        {
            if (window.parent && window.parent !== window)
            {
                volumeUrlFromParentUrl = getVolumeUrlFromSearch(window.parent.location.search)
            }
        }
        catch (error)
        {
            console.debug('[ISO-Viewer] Parent URL not accessible (cross-origin):', error)
        }
    }

    const resolvedVolumePath = volumeUrlFromViewerUrl || volumeUrlFromParentUrl || defaultVolumePath

    console.debug('[ISO-Viewer] volumeUrl from viewer URL:', volumeUrlFromViewerUrl)
    console.debug('[ISO-Viewer] volumeUrl from parent URL:', volumeUrlFromParentUrl)
    console.debug('[ISO-Viewer] Resolved volume path:', resolvedVolumePath)

    return [

        // NIFTI
        {
            name: 'volume',
            type: 'niftiFile',
            // path: 'nifti/colon/volume.nii.gz',
            // path: 'nifti/cardiac/mr_train_1014_image.nii.gz',
            path: resolvedVolumePath,
            // path: 'nifti/cardiac/ct_train_1002_label.nii.gz',
            // path: 'nifti/cardiac/mr_train_1014_image.nii.gz',
            // path: 'nifti/cardiac/mr_train_1014_label.nii.gz',
            // path: 'nifti/head/CTA-Head-and-Neck.nii.gz',
        },
    ]
}