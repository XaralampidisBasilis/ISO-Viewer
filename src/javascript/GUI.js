import Configs from './Utils/Configs'
import ControlPanels from './Utils/ControlPanels'
import { debugViews, debugViewAvailable } from './Utils/DebugViews'

export default class GUI
{
    constructor()
    {
        this.elements = Object.fromEntries(Array.from(document.querySelectorAll('[id]'), element => [element.id, element]))
        this.fields = Array.from(document.querySelectorAll('[data-config]'))
        this.qualityButtons = Array.from(document.querySelectorAll('[data-quality]'))
        this.cameraButtons = Array.from(document.querySelectorAll('[data-camera]'))
        this.viewButtons = Array.from(document.querySelectorAll('[data-view]'))
        this.listeners = new AbortController()
        this.touchInput = matchMedia('(pointer: coarse)')
        this.panels = new ControlPanels(this.elements['control-tabs'], panelId => {
            this.elements['debug-shortcut'].setAttribute('aria-expanded', String(panelId === 'debug-panel'))
        }, this.listeners.signal)

        for (const name of Configs.Colormaps)
            this.elements.colormap.add(new Option(name[0].toUpperCase() + name.slice(1), name))

        for (const [name, views] of Object.entries(debugViews))
        {
            const group = document.createElement('optgroup')
            group.label = name
            for (const [id, label] of Object.entries(views)) group.append(new Option(label, id))
            this.elements['debug-view'].append(group)
        }

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
        this.listen(this.elements['open-scan'], 'click', () => this.elements['scan-file'].click())
        this.listen(this.elements['scan-file'], 'change', event => {
            const input = event.target
            const file = input.files[0]
            input.value = ''
            if (file)
            {
                this.panels.select('scan-panel')
                experience.loadLocal(file)
            }
        })
        this.listen(this.elements['return-to-demo'], 'click', () => experience.loadQuality('preview'))

        this.listen(this.elements.isovalue, 'input', () => this.updateThresholdLabel())
        this.listen(this.elements.settings, 'change', event => {
            const field = event.target
            const key = field.dataset.config
            if (!key) return
            let value = field.value
            if (field.type === 'checkbox') value = field.checked
            else if (typeof configs.get(key) === 'number') value = Number(value)
            configs.set(key, value)
        })
        this.listen(this.elements['reset-isovalue'], 'click', () => configs.set('isosurfaceValue', this.defaultIsovalue))
        this.listen(this.elements['reset-view'], 'click', () => camera.reset())
        this.listen(this.elements['debug-shortcut'], 'click', () => this.panels.select('debug-panel', true))
        this.listen(this.elements['fps-toggle'], 'click', () => stats.setActive(!stats.active))
        stats.on('change', () => this.updateFps())

        for (const button of this.qualityButtons)
            this.listen(button, 'click', () => experience.loadQuality(button.dataset.quality))

        for (const button of this.viewButtons)
        {
            this.listen(button, 'click', () => {
                const view = Number(button.dataset.view)
                configs.set('diagnosticView', view)
                configs.set('debugEnabled', view !== 0)
            })
        }

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
        this.updateFps()
        this.sync()
    }

    updateFps()
    {
        const { active, fps } = this.experience.stats
        this.elements['fps-value'].textContent = fps ?? (active ? '…' : '—')
        this.elements['fps-toggle'].setAttribute('aria-pressed', String(active))
    }

    updateNavigationHelp()
    {
        const fly = this.experience.camera.mode === 'fly'
        const hint = this.touchInput.matches
            ? (fly ? 'Drag to look · Pinch to zoom' : 'Drag to orbit · Pinch to zoom · Pan with two fingers')
            : (fly ? 'Click the viewport · WASD to move · Drag to look · Q/E to roll · Space faster · Shift slower' : 'Drag to orbit · Scroll to zoom · Right-drag to pan')
        this.elements['navigation-help'].textContent = hint
    }

    updateThresholdLabel()
    {
        this.elements['isovalue-output'].value = Number(this.elements.isovalue.value).toFixed(3)
    }

    sync()
    {
        const { configs, computes, quality } = this.experience
        this.elements['settings-error'].hidden = true
        for (const field of this.fields)
        {
            const value = configs.get(field.dataset.config)
            if (field.type === 'checkbox') field.checked = value
            else field.value = String(value)
        }
        this.updateThresholdLabel()
        this.elements['bernstein-control'].firstElementChild.disabled = configs.marchingMethod !== 'digitalDifferentialAnalyzer'
        this.elements['debug-options'].hidden = !configs.debugEnabled
        this.elements['root-solver-setting'].hidden = configs.marchingMethod !== 'digitalDifferentialAnalyzer'
        if (configs.debugEnabled)
        {
            const trilinear = configs.interpolationMethod === 'trilinear'
            const solver = this.elements['root-solver']
            for (const option of solver.options) option.disabled = trilinear && Number(option.value) > 2
            solver.value = String(configs.effectiveRootSolver)

            const view = this.elements['debug-view']
            for (const option of view.options) option.disabled = !debugViewAvailable(Number(option.value), configs)
            view.value = String(configs.effectiveDebugView)
        }

        for (const button of this.viewButtons)
            button.setAttribute('aria-pressed', String(Number(button.dataset.view) === configs.effectiveDebugView))

        if (!quality) return
        for (const button of this.qualityButtons)
            button.setAttribute('aria-pressed', String(button.dataset.quality === quality))

        const dimensions = computes.volumeMap.dimensions.toArray().join(' × ')
        const blocks = computes.occupancyMap.dimensions.toArray().join(' × ')
        if (configs.debugEnabled)
        {
            this.elements['debug-spacing'].textContent = computes.volumeMap.spacing.toArray()
                .map(value => Number((value * 1000).toPrecision(3))).join(' × ') + ' mm'
        }
        this.elements['viewport-resolution'].textContent = dimensions
        this.elements['viewport-block-grid'].textContent = blocks
        this.elements['grid-readouts'].hidden = false
        this.elements['empty-view'].hidden = computes.occupancyMap.boundingBox !== null || configs.debugEnabled
    }

    busy(busy)
    {
        this.elements['settings-fields'].disabled = busy
        this.elements['threshold-fields'].disabled = busy
        this.elements['open-scan'].disabled = busy
        this.elements['debug-shortcut'].disabled = busy
        this.elements['fps-toggle'].disabled = busy
        for (const button of this.viewButtons) button.disabled = busy
    }

    startLocalLoad()
    {
        this.elements['loading-description'].textContent = 'Opening a NIfTI file from this device'
        this.elements['loading-progress'].hidden = false
        this.elements.retry.hidden = true
    }

    setProgress(initial, label, loaded, total)
    {
        if (!this.elements['settings-error'].hidden) this.elements['settings-error'].hidden = true
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
        const local = quality === 'local'
        this.elements['scan-type'].textContent = local ? 'Local NIfTI' : 'CT angiography'
        this.elements['scan-title'].textContent = local ? 'Your scan' : 'Head & neck'
        this.elements['scan-description'].textContent = local ? this.experience.scanName : ''
        this.elements['scan-description'].hidden = !local
        this.elements['quality-label'].textContent = local ? 'Scan source' : 'Volume detail'
        this.elements['demo-quality'].hidden = local
        this.elements['return-to-demo'].hidden = !local
        this.updateScanStatus(quality)
        this.busy(false)
        this.sync()
    }

    updateScanStatus(quality)
    {
        const local = quality === 'local'
        const status = this.elements['quality-status']
        status.textContent = local
            ? 'This file stays on your device.'
            : quality === 'preview' ? 'High detail downloads the 84 MiB source scan.' : 'High detail is active.'
        if (local && this.experience.configs.downscaleFactor < 1)
            status.textContent += ' Large grids are rendered at reduced resolution.'
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
            this.elements['open-scan'].disabled = !this.experience || this.experience.contextLost
        }
        else
        {
            this.elements['quality-progress'].hidden = true
            this.updateScanStatus(this.experience.quality)
            this.busy(false)
            this.sync()
            const notice = this.elements['settings-error']
            notice.textContent = message
            notice.hidden = false
        }
    }

    destroy()
    {
        this.listeners.abort()
    }
}
