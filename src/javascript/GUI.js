import Configs from './Utils/Configs'

export default class GUI
{
    constructor()
    {
        this.elements = Object.fromEntries(Array.from(document.querySelectorAll('[id]'), element => [element.id, element]))
        this.fields = Array.from(document.querySelectorAll('[data-config]'))
        this.qualityButtons = Array.from(document.querySelectorAll('[data-quality]'))
        this.cameraButtons = Array.from(document.querySelectorAll('[data-camera]'))
        this.listeners = new AbortController()
        this.touchInput = matchMedia('(pointer: coarse)')

        const palette = this.elements.colormap
        for (const name of Configs.Colormaps)
            palette.add(new Option(name[0].toUpperCase() + name.slice(1), name))

        this.listen(this.elements['open-research'], 'click', () => this.elements['research-dialog'].showModal())
        this.listen(this.elements.retry, 'click', () => location.reload())
        this.listen(this.elements.settings, 'submit', event => event.preventDefault())
    }

    listen(element, name, listener)
    {
        element.addEventListener(name, listener, { signal: this.listeners.signal })
    }

    connect(experience)
    {
        this.experience = experience
        const { configs, camera, stats } = experience
        this.defaultIsovalue = configs.isosurfaceValue
        this.listen(this.touchInput, 'change', () => this.updateNavigationHelp())

        this.listen(this.elements.isovalue, 'input', () => this.updateThresholdLabel())
        this.listen(this.elements.settings, 'change', event => {
            const field = event.target
            if (!field.dataset.config) return
            let value = field.value
            if (field.type === 'checkbox') value = field.checked
            else if (field.type === 'range' || field.dataset.config === 'diagnosticView') value = Number(value)
            configs.set(field.dataset.config, value)
        })
        this.listen(this.elements['reset-isovalue'], 'click', () => configs.set('isosurfaceValue', this.defaultIsovalue))
        this.listen(this.elements['reset-view'], 'click', () => camera.reset())
        this.listen(this.elements['show-stats'], 'click', event => {
            if (stats.active) stats.deactivate()
            else stats.activate()
            event.target.setAttribute('aria-pressed', String(stats.active))
            event.target.textContent = stats.active ? 'Hide frame statistics' : 'Show frame statistics'
            experience.invalidate()
        })

        for (const button of this.qualityButtons)
            this.listen(button, 'click', () => experience.loadQuality(button.dataset.quality))

        for (const button of this.cameraButtons)
        {
            this.listen(button, 'click', () => {
                const mode = button.dataset.camera
                if (camera.mode === mode) return
                camera.setMode(mode)
                for (const control of this.cameraButtons)
                    control.setAttribute('aria-pressed', String(control === button))
                this.updateNavigationHelp()
            })
        }

        this.updateNavigationHelp()
        this.sync()
    }

    updateNavigationHelp()
    {
        const fly = this.experience.camera.mode === 'fly'
        const hint = this.touchInput.matches
            ? (fly ? 'Drag to look · Pinch to zoom' : 'Drag to orbit · Pinch to zoom · Pan with two fingers')
            : (fly ? 'Click the viewport · WASD to move · Drag to look · Q/E to roll' : 'Drag to orbit · Scroll to zoom · Right-drag to pan')
        this.elements['navigation-help'].textContent = hint
    }

    updateThresholdLabel()
    {
        this.elements['isovalue-output'].value = Number(this.elements.isovalue.value).toFixed(3)
    }

    sync()
    {
        const { configs, computes, quality } = this.experience
        for (const field of this.fields)
        {
            const value = configs.get(field.dataset.config)
            if (field.type === 'checkbox') field.checked = value
            else field.value = String(value)
        }
        this.updateThresholdLabel()
        this.elements['bernstein-control'].firstElementChild.disabled = configs.marchingMethod !== 'digitalDifferentialAnalyzer'
        this.elements['show-misses'].hidden = configs.diagnosticView === 0

        if (!quality) return
        for (const button of this.qualityButtons)
            button.setAttribute('aria-pressed', String(button.dataset.quality === quality))

        const dimensions = computes.volumeMap.dimensions.toArray().join(' × ')
        this.elements['viewport-resolution'].textContent = dimensions + ' voxels'
        this.elements['viewport-resolution'].hidden = false
        this.elements['empty-view'].hidden = computes.occupancyMap.boundingBox !== null || configs.diagnosticView !== 0
    }

    busy(busy)
    {
        this.elements['settings-fields'].disabled = busy
    }

    setProgress(initial, label, loaded, total)
    {
        const bar = this.elements[initial ? 'loading-progress' : 'quality-progress']
        if (initial)
        {
            const title = this.elements['loading-title']
            if (title.textContent !== label) title.textContent = label
        }
        else
        {
            const status = this.elements['quality-status']
            if (status.textContent !== label) status.textContent = label
            status.classList.remove('error')
        }

        bar.hidden = !initial && loaded === undefined
        if (total > 0) bar.value = Math.min(1, loaded / total)
        else bar.removeAttribute('value')
    }

    ready(quality)
    {
        this.elements.loading.hidden = true
        this.elements['viewport-tools'].hidden = false
        this.elements['quality-progress'].hidden = true
        const status = this.elements['quality-status']
        status.classList.remove('error')
        status.textContent = quality === 'preview'
            ? 'High detail downloads the 84 MiB source scan.'
            : 'High detail is active.'
        this.busy(false)
        this.sync()
    }

    fail(error, fatal)
    {
        const message = error.message || 'An unexpected error interrupted the viewer.'
        if (fatal)
        {
            this.busy(true)
            this.elements.loading.hidden = false
            this.elements['viewport-tools'].hidden = true
            this.elements['loading-title'].textContent = 'Viewer unavailable'
            this.elements['loading-description'].textContent = message
            this.elements['loading-progress'].hidden = true
            this.elements.retry.hidden = false
        }
        else
        {
            this.elements['quality-progress'].hidden = true
            const status = this.elements['quality-status']
            status.textContent = message
            status.classList.add('error')
            this.busy(false)
            this.sync()
        }
    }

    destroy()
    {
        this.listeners.abort()
    }
}
