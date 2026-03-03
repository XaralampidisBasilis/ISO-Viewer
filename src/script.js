
import { setTensorflow } from './javascript/tensorflow';
import Experience from './javascript/Experience'
import createSources from './javascript/sources'


(async () => 
{
    await setTensorflow()

    const canvas = document.querySelector('canvas.webgl')
    const context = canvas.getContext('webgl2')
    if (!context) throw new Error('WebGL2 not supported by your browser or device.')

    const datasources = createSources()
    console.debug('[ISO-Viewer] Initial datasources:', datasources)

    let experience = new Experience(canvas, context)

    const getCurrentVolumeUrl = () =>
    {
        return new URLSearchParams(window.location.search).get('volumeUrl') || ''
    }

    let currentVolumeUrl = getCurrentVolumeUrl()

    const recreateExperience = () =>
    {
        const nextVolumeUrl = getCurrentVolumeUrl()
        console.debug('[ISO-Viewer] urlchange event detected, volumeUrl:', nextVolumeUrl)
        if(nextVolumeUrl === currentVolumeUrl)
        {
            return
        }

        currentVolumeUrl = nextVolumeUrl
        experience?.destroy()
        experience = new Experience(canvas, context)
        console.debug('[ISO-Viewer] Viewer recreated, loaded image url:', nextVolumeUrl)
    }

    const emitUrlChange = (source = 'unknown') =>
    {
        console.debug(`[ISO-Viewer] emitUrlChange called from: ${source}`)
        window.dispatchEvent(new Event('urlchange'))
    }

    let lastObservedHref = window.location.href

    const observeUrlChanges = () =>
    {
        const nextHref = window.location.href
        if(nextHref === lastObservedHref)
        {
            return
        }

        lastObservedHref = nextHref
        emitUrlChange()
    }

    const originalPushState = window.history.pushState
    window.history.pushState = function(...args)
    {
        const result = originalPushState.apply(this, args)
        emitUrlChange('pushState')
        return result
    }

    const originalReplaceState = window.history.replaceState
    window.history.replaceState = function(...args)
    {
        const result = originalReplaceState.apply(this, args)
        emitUrlChange('replaceState')
        return result
    }

    window.addEventListener('popstate', () => emitUrlChange('popstate'))
    window.addEventListener('hashchange', () => emitUrlChange('hashchange'))
    window.addEventListener('urlchange', recreateExperience)

    const urlObserverId = window.setInterval(() => {
        const nextHref = window.location.href
        if(nextHref !== lastObservedHref)
        {
            console.debug('[ISO-Viewer] url observer detected change:', nextHref)
            lastObservedHref = nextHref
            emitUrlChange('observer')
        }
    }, 150)
    window.addEventListener('beforeunload', () => window.clearInterval(urlObserverId))
}
)()