import Configs from './Utils/Configs'
import ControlPanels from './Utils/ControlPanels'
import TraversalLegend from './Utils/TraversalLegend'
import { debugViews, debugViewSources, debugViewUnavailableReason } from './Utils/DebugViews'

const overlayControls = [
    ['toggle-occupancy-wireframe', 'occupancyWireframeVisible'],
    ['toggle-bounding-box', 'boundingBoxVisible'],
    ['toggle-volume-box', 'volumeBoxVisible'],
    ['toggle-orientation-cube', 'orientationCubeVisible'],
]

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
        new ControlPanels(this.elements['control-tabs'], this.listeners.signal)
        this.setupDebugBrowser()
        this.viewButtons = Array.from(document.querySelectorAll('[data-view]'))
        this.setupMenu()
        this.setupFullscreen()

        for (const name of Configs.Colormaps)
            this.elements.colormap.add(new Option(name[0].toUpperCase() + name.slice(1), name))

        this.listen(this.elements.retry, 'click', () => location.reload())
        this.listen(this.elements.settings, 'submit', event => event.preventDefault())
    }

    listen(element, name, listener)
    {
        element.addEventListener(name, listener, { signal: this.listeners.signal })
    }

    setupDebugBrowser()
    {
        const categories = this.elements['debug-categories']
        const views = this.elements['debug-views']
        Object.entries(debugViews).forEach(([name, entries], index) => {
            const category = document.createElement('button')
            category.type = 'button'
            category.id = `debug-category-${index}`
            category.textContent = name
            category.setAttribute('role', 'tab')

            const panel = document.createElement('div')
            panel.id = `debug-views-${index}`
            panel.setAttribute('role', 'tabpanel')
            panel.setAttribute('aria-labelledby', category.id)
            category.setAttribute('aria-controls', panel.id)

            for (const [id, label] of Object.entries(entries))
            {
                const button = document.createElement('button')
                button.type = 'button'
                button.dataset.view = id
                const name = document.createElement('span')
                name.className = 'debug-view-name'
                name.textContent = label
                button.append(name)
                button.disabled = true
                panel.append(button)
            }

            categories.append(category)
            views.append(panel)
        })

        const panels = new ControlPanels(categories, this.listeners.signal)
        this.debugPanels = panels
        panels.select(categories.firstElementChild.getAttribute('aria-controls'))
        for (const category of categories.children)
        {
            this.listen(category, 'pointerenter', event => {
                if (event.pointerType === 'mouse') panels.select(category.getAttribute('aria-controls'))
            })
        }
    }

    setupMenu()
    {
        const menuBar = this.elements['menu-bar']
        const menus = Array.from(menuBar.querySelectorAll('details'))
        for (const menu of menus)
        {
            const summary = menu.querySelector('summary')
            this.listen(menu, 'click', event => {
                if (!event.target.closest('button:not([role="tab"])')) return
                if (menu.contains(document.activeElement)) summary.focus()
                menu.open = false
            })
            this.listen(menu, 'keydown', event => {
                if (event.key !== 'Escape' || !menu.open) return
                event.preventDefault()
                menu.open = false
                summary.focus()
            })
            this.listen(menu, 'focusout', event => {
                if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false
            })
        }
        this.listen(document, 'pointerdown', event => {
            for (const menu of menus)
                if (!menu.contains(event.target)) menu.open = false
        })

        for (const button of menuBar.querySelectorAll('[data-dialog]'))
        {
            this.listen(button, 'click', () => {
                button.closest('details').querySelector('summary').focus()
                this.elements[button.dataset.dialog].showModal()
            })
        }

        this.themeButtons = Array.from(menuBar.querySelectorAll('[data-theme]'))
        let theme = 'light'
        try { if (localStorage.getItem('isoviewer-theme') === 'dark') theme = 'dark' }
        catch { /* Storage may be unavailable. */ }
        this.applyTheme(theme)
        for (const button of this.themeButtons)
        {
            this.listen(button, 'click', () => {
                const choice = button.dataset.theme
                this.applyTheme(choice)
                try { localStorage.setItem('isoviewer-theme', choice) }
                catch { /* The current theme still applies. */ }
            })
        }
    }

    applyTheme(theme)
    {
        const root = document.documentElement
        root.dataset.theme = theme
        for (const button of this.themeButtons)
            button.setAttribute('aria-pressed', String(button.dataset.theme === theme))
        document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--titlebar').trim()
        this.experience?.invalidate()
    }

    setupFullscreen()
    {
        const { viewport, 'fullscreen-toggle': button } = this.elements
        const sync = () => {
            const fullscreen = document.fullscreenElement === viewport || viewport.classList.contains('viewport-expanded')
            const label = fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
            button.firstElementChild.textContent = fullscreen ? '×' : '⛶'
            button.setAttribute('aria-label', label)
            button.title = label
        }
        const expandWindow = expanded => {
            viewport.classList.toggle('viewport-expanded', expanded)
            sync()
        }

        button.hidden = false
        this.listen(button, 'click', async () => {
            if (viewport.classList.contains('viewport-expanded')) expandWindow(false)
            else if (document.fullscreenElement === viewport)
            {
                try { await document.exitFullscreen() }
                catch (error) { console.warn('Could not exit fullscreen.', error) }
            }
            else if (document.fullscreenEnabled)
            {
                try { await viewport.requestFullscreen() }
                catch { expandWindow(true) }
            }
            else expandWindow(true)
        })
        this.listen(document, 'fullscreenchange', sync)
        this.listen(document, 'keydown', event => {
            if (event.key !== 'Escape' || !viewport.classList.contains('viewport-expanded')) return
            event.preventDefault()
            expandWindow(false)
        })
    }

    connect(experience)
    {
        this.experience = experience
        const { configs, camera, renderer, stats } = experience
        this.counterLegend = new TraversalLegend(this.elements, renderer.instance)
        this.listen(this.touchInput, 'change', () => this.updateNavigationHelp())
        this.listen(this.elements['open-scan'], 'click', () => this.elements['scan-file'].click())
        this.listen(this.elements['scan-file'], 'change', event => {
            const input = event.target
            const file = input.files[0]
            input.value = ''
            if (file) experience.loadLocal(file)
        })

        this.listen(this.elements.isovalue, 'input', event => {
            const value = event.target.valueAsNumber
            this.elements['isovalue-output'].value = value.toFixed(3)
        })
        this.listen(this.elements['isovalue-output'], 'keydown', event => {
            if (event.key !== 'Enter' && event.key !== 'Escape') return
            event.preventDefault()
            if (event.key === 'Escape')
                event.target.value = configs.isosurfaceValue.toFixed(3)
            event.target.blur()
        })
        this.listen(this.elements['threshold-controls'], 'change', event => {
            const field = event.target
            if (field.validity.valid) configs.set('isosurfaceValue', field.valueAsNumber)
            this.syncThreshold()
        })
        this.listen(this.elements.settings, 'change', event => {
            const field = event.target
            const key = field.dataset.config
            if (!key) return
            let value = field.value
            if (field.type === 'checkbox') value = field.checked
            else if (typeof configs.get(key) === 'number') value = Number(value)
            configs.set(key, value)
        })
        this.listen(this.elements['debug-enabled'], 'change', event => {
            configs.set('diagnosticView', 0)
            configs.set('debugEnabled', event.target.checked)
        })
        this.listen(this.elements['reset-view'], 'click', () => camera.reset())
        this.listen(this.elements['back-to-surface'], 'click', () => {
            this.setDiagnosticView(0)
            experience.canvas.focus({ preventScroll: true })
        })
        for (const [id, key] of overlayControls)
            this.listen(this.elements[id], 'click', () => {
                const visible = !configs[key]
                configs.set(key, visible)
                if (visible && key === 'occupancyWireframeVisible') this.setDiagnosticView(0)
            })
        this.listen(this.elements['fps-toggle'], 'click', () => stats.setActive(!stats.active))
        this.listen(this.elements['render-details'], 'toggle', event => {
            if (!event.target.open) stats.setActive(false)
        })
        stats.on('change', () => this.updateFps())
        renderer.on('resize.gui', () => this.updateViewSize())

        for (const button of this.qualityButtons)
            this.listen(button, 'click', () => experience.loadQuality(button.dataset.quality))

        for (const button of this.viewButtons)
            this.listen(button, 'click', () => this.setDiagnosticView(Number(button.dataset.view)))

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
        this.updateViewSize()
        this.sync()
    }

    setDiagnosticView(view)
    {
        const { configs } = this.experience
        if (view !== 0)
        {
            configs.set('diagnosticView', view)
            const option = this.elements['debug-views'].querySelector(`[data-view="${view}"]`)
            if (option) this.debugPanels.select(option.parentElement.id)
        }
        configs.set('debugEnabled', view !== 0)
    }

    updateDebugControls()
    {
        const configs = this.experience?.configs
        const disabled = this.elements['settings-fields'].disabled || !configs
        this.elements['debug-controls'].disabled = disabled
        for (const [id, key] of overlayControls)
        {
            const button = this.elements[id]
            const available = key !== 'orientationCubeVisible' || Boolean(this.experience?.computes.volume?.patientOrientation)
            button.disabled = disabled || !available
            button.setAttribute('aria-pressed', String(available && (configs?.get(key) ?? false)))
        }
        this.elements['debug-options'].hidden = !configs?.debugEnabled
        const activeView = configs?.effectiveDebugView ?? 0
        const activeButton = this.viewButtons.find(button => Number(button.dataset.view) === activeView)
        const label = activeButton?.textContent.trim() || 'Surface'
        const viewLabel = this.elements['active-view']
        if (viewLabel.textContent !== label) viewLabel.textContent = label
        const back = this.elements['back-to-surface']
        back.hidden = activeView === 0
        back.disabled = disabled
        this.elements['debug-view-status'].textContent = activeView
            ? `Viewing ${label}`
            : 'Select a diagnostic to replace the shaded surface.'
        for (const button of this.viewButtons)
        {
            const view = Number(button.dataset.view)
            const reason = configs ? debugViewUnavailableReason(view, configs) : ''
            button.disabled = disabled || Boolean(reason)
            button.title = reason || debugViewSources[view] || button.textContent
            if (reason) button.setAttribute('aria-description', reason)
            else button.removeAttribute('aria-description')
            button.setAttribute('aria-pressed', String(view === activeView))
        }
    }

    updateFps()
    {
        const { active, fps } = this.experience.stats
        this.elements['fps-value'].textContent = fps ?? (active ? '…' : '—')
        this.elements['fps-toggle'].setAttribute('aria-pressed', String(active))
    }

    updateViewSize()
    {
        const { drawingBufferWidth, drawingBufferHeight } = this.experience.context
        const size = drawingBufferWidth && drawingBufferHeight ? `${drawingBufferWidth} × ${drawingBufferHeight} px` : '—'
        const readout = this.elements['status-view-size']
        if (readout.textContent !== size) readout.textContent = size
    }

    updateNavigationHelp()
    {
        const fly = this.experience.camera.mode === 'fly'
        const hint = this.touchInput.matches
            ? (fly ? 'Drag to look · Pinch to zoom' : 'Drag to orbit · Pinch to zoom · Pan with two fingers')
            : (fly ? 'Click the viewport · WASD to move · Drag to look · Q/E to roll · Space faster · Shift slower' : 'Drag to orbit · Scroll to zoom · Right-drag to pan')
        this.elements['navigation-help'].textContent = hint
    }

    syncThreshold()
    {
        const value = this.experience.configs.isosurfaceValue.toFixed(3)
        this.elements.isovalue.value = this.elements['isovalue-output'].value = value
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
        this.syncThreshold()
        this.elements['bernstein-control'].firstElementChild.disabled = configs.marchingMethod !== 'digitalDifferentialAnalyzer'
        this.updateDebugControls()

        if (!quality) return
        this.counterLegend.update(this.experience.world.viewer.material.uniforms.u_debug.value)
        for (const button of this.qualityButtons)
            button.setAttribute('aria-pressed', String(button.dataset.quality === quality))

        const { dimensions, spacing } = computes.volumeMap
        const voxelGrid = dimensions.toArray().join(' × ')
        const blockGrid = computes.occupancyMap.dimensions.toArray().join(' × ')
        const { blockSize } = computes.extremaMap
        this.elements['volume-dimensions'].textContent = voxelGrid
        this.elements['volume-spacing'].textContent = spacing.toArray()
            .map(value => Number((value * 1000).toPrecision(3))).join(' × ') + ' mm'
        this.elements['volume-block-grid'].textContent = blockGrid
        this.elements['volume-block-size'].textContent = [blockSize, blockSize, blockSize].join(' × ') + ' cells'
        this.elements['status-voxel-grid'].textContent = voxelGrid
        this.elements['status-block-grid'].textContent = blockGrid
        this.elements['render-details'].hidden = false
        this.elements['open-volume-parameters'].disabled = false
        this.elements['empty-view'].hidden = computes.occupancyMap.boundingBox !== null || configs.effectiveDebugView !== 0
    }

    busy(busy)
    {
        this.elements['settings-fields'].disabled = busy
        this.elements['threshold-controls'].disabled = busy
        this.updateDebugControls()
        this.elements['open-scan'].disabled = busy
        this.elements['fps-toggle'].disabled = busy
        const cameraUnavailable = !this.experience?.ready
        this.elements['reset-view'].disabled = cameraUnavailable
        for (const button of this.cameraButtons) button.disabled = cameraUnavailable
        for (const button of this.qualityButtons) button.disabled = busy
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
            this.elements['quality-notice'].hidden = false
        }

        bar.hidden = !initial && loaded === undefined
        if (total > 0) bar.value = Math.min(1, loaded / total)
        else bar.removeAttribute('value')
    }

    ready(quality)
    {
        this.elements.loading.hidden = true
        this.elements['quality-notice'].hidden = true
        const local = quality === 'local'
        this.elements['scan-title'].textContent = local ? 'Local NIfTI' : 'Head & neck CTA'
        this.elements['scan-description'].textContent = local ? this.experience.scanName : ''
        this.elements['scan-description'].hidden = !local
        this.elements['volume-source'].textContent = local ? this.experience.scanName : 'Head & neck CTA'
        const qualityLabel = local ? 'Local scan' : quality === 'detail' ? 'Detailed scan' : 'Preview scan'
        const indicator = this.elements['scan-quality']
        if (indicator.textContent !== qualityLabel) indicator.textContent = qualityLabel
        indicator.hidden = false
        this.elements['volume-detail'].textContent = qualityLabel
        this.elements['volume-resampling'].hidden = !local || this.experience.configs.downscaleFactor >= 1
        this.busy(false)
        this.sync()
    }

    fail(error, fatal)
    {
        const message = error.message || 'An unexpected error interrupted the viewer.'
        this.elements['quality-notice'].hidden = true
        if (fatal)
        {
            this.counterLegend?.update(null)
            this.busy(true)
            this.elements.loading.hidden = false
            this.elements['loading-title'].textContent = 'Viewer unavailable'
            this.elements['loading-description'].textContent = message
            this.elements['loading-progress'].hidden = true
            this.elements.retry.hidden = false
            this.elements['open-scan'].disabled = !this.experience || this.experience.contextLost
        }
        else
        {
            this.busy(false)
            this.sync()
            const notice = this.elements['settings-error']
            notice.textContent = message
            notice.hidden = false
        }
    }

    destroy()
    {
        this.experience?.renderer.off('resize.gui')
        this.listeners.abort()
    }
}
