import Configs from './Utils/Configs'
import TraversalLegend from './Utils/TraversalLegend'
import { debugViews, debugViewSources, debugViewUnavailableReason } from './Utils/DebugViews'
import { activeVariants, variantStages } from './Computes/Variants'

const overlayControls = [
    ['toggle-occupancy-wireframe', 'occupancyWireframeVisible'],
    ['toggle-bounding-box', 'boundingBoxVisible'],
    ['toggle-volume-box', 'volumeBoxVisible'],
    ['toggle-orientation-cube', 'orientationCubeVisible'],
]

// Keep the normal and curvature shader IDs available to developer tooling.
const hiddenDebugViews = new Set(['459', '462'])

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
        this.setupDebugBrowser()
        this.setupMenu()
        this.setupFullscreen()
        this.setupVariants()

        for (const name of Configs.Colormaps)
            this.elements.colormap.add(new Option(name[0].toUpperCase() + name.slice(1), name))

        this.listen(this.elements.retry, 'click', () => location.reload())
        this.listen(this.elements.settings, 'submit', event => event.preventDefault())
    }

    listen(element, name, listener)
    {
        element.addEventListener(name, listener, { signal: this.listeners.signal })
    }

    setupVariants()
    {
        const elements = this.elements
        this.listen(elements['rebuild-variants'], 'click', () => this.runVariants())
    }

    populateVariants()
    {
        const { configs } = this.experience
        const container = this.elements['variant-stages']
        const active = activeVariants(configs)
        this.variantMethod = configs.skippingMethod
        this.variantStages = variantStages(this.variantMethod)
        this.variantSelectors = {}
        container.replaceChildren()

        for (const [key, { label, choices }] of Object.entries(this.variantStages))
        {
            const row = document.createElement('label')
            const select = document.createElement('select')
            row.className = 'select-setting'
            row.append(label, select)
            container.append(row)

            for (const [value, name] of Object.entries(choices)) select.add(new Option(name, value))
            select.value = active[key]
            this.variantSelectors[key] = select
        }

    }

    async runVariants()
    {
        const { configs, computes } = this.experience
        const result = this.elements['variant-result']
        const baseline = Object.fromEntries(Object.entries(this.variantSelectors).map(([key, select]) => [key, select.value]))
        const previous = computes.preprocessingTimes?.elapsed

        this.variantTimingKey = computes.timingKey(configs.downscaleFactor)
        this.variantVolume = computes.volume
        result.textContent = 'Measuring a full rebuild…'

        try
        {
            const [elapsed] = await this.experience.runVariantRebuilds([baseline])
            if (this.listeners.signal.aborted) return

            const format = time => `${Math.round(time).toLocaleString()} ms`
            result.textContent = `Total · ${format(elapsed)}`
            if (previous != null) result.textContent += `\nPrevious rebuild · ${format(previous)}`
        }
        catch (error)
        {
            result.textContent = error.message || 'The variant rebuild failed.'
            console.error(error)
        }
        finally
        {
            if (!this.listeners.signal.aborted) this.populateVariants()
        }
    }

    setupDebugBrowser()
    {
        const views = this.elements['debug-views']
        const categories = document.createElement('nav')
        const panels = document.createElement('div')
        categories.className = 'debug-categories'
        categories.setAttribute('aria-label', 'Debug categories')
        panels.className = 'debug-variable-panels'
        views.append(categories, panels)
        this.debugButtons = []
        const categoryButtons = []
        const selectCategory = selected =>
        {
            for (const button of categoryButtons)
            {
                const active = button === selected
                button.setAttribute('aria-pressed', String(active))
                document.getElementById(button.getAttribute('aria-controls')).hidden = !active
            }
        }

        for (const [index, [name, entries]] of Object.entries(debugViews).entries())
        {
            const category = document.createElement('button')
            const variables = document.createElement('div')
            category.type = 'button'
            category.textContent = name
            category.id = `debug-category-${index}`
            variables.id = `debug-variables-${index}`
            variables.className = 'debug-variables'
            variables.setAttribute('role', 'group')
            variables.setAttribute('aria-labelledby', category.id)
            category.setAttribute('aria-controls', variables.id)
            categories.append(category)
            panels.append(variables)
            categoryButtons.push(category)
            this.listen(category, 'click', () => selectCategory(category))

            for (const [id, label] of Object.entries(entries))
            {
                if (hiddenDebugViews.has(id)) continue

                const button = document.createElement('button')
                button.type = 'button'
                button.dataset.view = id
                button.textContent = label
                button.setAttribute('aria-pressed', 'false')
                variables.append(button)
                this.debugButtons.push(button)
                this.listen(button, 'click', () => this.setDiagnosticView(Number(id)))
            }
        }

        selectCategory(categoryButtons.find(button => button.textContent === 'Counters') ?? categoryButtons[0])
    }

    setupMenu()
    {
        const menuBar = this.elements['menu-bar']
        const menus = Array.from(menuBar.querySelectorAll('details'))
        for (const menu of menus)
        {
            const summary = menu.querySelector('summary')
            this.listen(menu, 'click', event =>
            {
                if (!event.target.closest('button')) return
                if (menu.contains(document.activeElement)) summary.focus()
                menu.open = false
            })
            this.listen(menu, 'keydown', event =>
            {
                if (event.key !== 'Escape' || !menu.open) return
                event.preventDefault()
                menu.open = false
                summary.focus()
            })
            this.listen(menu, 'focusout', event =>
            {
                if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false
            })
        }
        this.listen(document, 'pointerdown', event =>
        {
            for (const menu of menus)
                if (!menu.contains(event.target)) menu.open = false
        })

        for (const button of menuBar.querySelectorAll('[data-dialog]'))
        {
            this.listen(button, 'click', () =>
            {
                button.closest('details').querySelector('summary').focus()
                this.elements[button.dataset.dialog].showModal()
            })
        }

        const controlButtons = Array.from(menuBar.querySelectorAll('[data-control-panel]'))
        for (const button of controlButtons)
        {
            this.listen(button, 'click', () =>
            {
                for (const control of controlButtons)
                {
                    const active = control === button
                    control.setAttribute('aria-current', String(active))
                    this.elements[control.dataset.controlPanel].hidden = !active
                }

                const panel = this.elements[button.dataset.controlPanel]
                panel.querySelector('h2').focus()
            })
        }

        this.themeButtons = Array.from(menuBar.querySelectorAll('[data-theme]'))
        let theme = 'light'
        try
        {
            if (localStorage.getItem('isoviewer-theme') === 'dark') theme = 'dark'
        }
        catch
        {
            /* Storage may be unavailable. */
        }
        this.applyTheme(theme)
        for (const button of this.themeButtons)
        {
            this.listen(button, 'click', () =>
            {
                const choice = button.dataset.theme
                this.applyTheme(choice)
                try
                {
                    localStorage.setItem('isoviewer-theme', choice)
                }
                catch
                {
                    /* The current theme still applies. */
                }
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

        const sync = () =>
        {
            const fullscreen = document.fullscreenElement === viewport || viewport.classList.contains('viewport-expanded')
            const label = fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
            button.firstElementChild.textContent = fullscreen ? '×' : '⛶'
            button.setAttribute('aria-label', label)
            button.title = label
        }

        const expandWindow = expanded =>
        {
            viewport.classList.toggle('viewport-expanded', expanded)
            sync()
        }

        button.hidden = false

        this.listen(button, 'click', async () =>
        {
            if (viewport.classList.contains('viewport-expanded')) expandWindow(false)
            else if (document.fullscreenElement === viewport)
            {
                try
                {
                    await document.exitFullscreen()
                }
                catch (error)
                {
                    console.warn('Could not exit fullscreen.', error)
                }
            }
            else if (document.fullscreenEnabled)
            {
                try
                {
                    await viewport.requestFullscreen()
                }
                catch
                {
                    expandWindow(true)
                }
            }
            else expandWindow(true)
        })

        this.listen(document, 'fullscreenchange', sync)
        this.listen(document, 'keydown', event =>
        {
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
        this.listen(this.elements['shading-view'], 'change', event =>
        {
            this.setDiagnosticView(Number(event.target.value))
        })
        this.listen(this.touchInput, 'change', () => this.updateNavigationHelp())
        this.listen(this.elements['open-scan'], 'click', () => this.elements['scan-file'].click())
        this.listen(this.elements['scan-file'], 'change', event =>
        {
            const input = event.target
            const file = input.files[0]
            input.value = ''
            if (file) experience.loadLocal(file)
        })

        this.listen(this.elements.isovalue, 'input', event =>
        {
            const value = event.target.valueAsNumber
            this.elements['isovalue-output'].value = value.toFixed(3)
        })
        this.listen(this.elements['isovalue-output'], 'keydown', event =>
        {
            if (event.key !== 'Enter' && event.key !== 'Escape') return
            event.preventDefault()
            if (event.key === 'Escape')
                event.target.value = configs.isosurfaceValue.toFixed(3)
            event.target.blur()
        })
        this.listen(this.elements['threshold-controls'], 'change', event =>
        {
            const field = event.target
            if (field.validity.valid) configs.set('isosurfaceValue', field.valueAsNumber)
            this.syncThreshold()
        })
        this.listen(this.elements.settings, 'change', event =>
        {
            const field = event.target
            const key = field.dataset.config
            if (!key) return
            let value = field.value
            if (field.type === 'checkbox') value = field.checked
            else if (typeof configs.get(key) === 'number') value = Number(value)
            if (key === 'debugEnabled') configs.set('diagnosticView', 0)
            configs.set(key, value)
        })
        this.listen(this.elements['reset-view'], 'click', () => camera.reset())
        for (const [id, key] of overlayControls)
            this.listen(this.elements[id], 'change', event =>
            {
                const visible = event.target.checked
                configs.set(key, visible)
                if (visible && key === 'occupancyWireframeVisible') this.setDiagnosticView(0)
            })
        this.listen(this.elements['fps-toggle'], 'click', () => stats.setActive(!stats.active))
        this.listen(this.elements['render-details'], 'toggle', event =>
        {
            if (!event.target.open) stats.setActive(false)
        })
        stats.on('change', () => this.updateFps())
        renderer.on('resize.gui', () => this.updateViewSize())

        for (const button of this.qualityButtons)
            this.listen(button, 'click', () => experience.loadQuality(button.dataset.quality))

        for (const button of this.cameraButtons)
        {
            this.listen(button, 'click', () =>
            {
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
        configs.set('diagnosticView', view)
        configs.set('debugEnabled', view !== 0)
    }

    updateDebugControls()
    {
        const configs = this.experience?.configs
        const disabled = this.elements['settings-fields'].disabled || !configs
        for (const [id, key] of overlayControls)
        {
            const field = this.elements[id]
            const available = key !== 'orientationCubeVisible' || Boolean(this.experience?.computes.volume?.patientOrientation)
            field.disabled = disabled || !available
            field.checked = available && (configs?.get(key) ?? false)
        }
        this.elements['debug-options'].hidden = !configs?.debugEnabled
        const activeView = configs?.effectiveDebugView ?? 0
        const shadingView = this.elements['shading-view']
        const shadingOption = Array.from(shadingView.options).find(option => option.value === String(activeView))
        shadingView.querySelector('[value="debug"]').hidden = Boolean(shadingOption)
        shadingView.value = shadingOption ? String(activeView) : 'debug'
        const activeButton = this.debugButtons.find(button => Number(button.dataset.view) === activeView)
        const label = shadingOption?.textContent.trim() || activeButton?.textContent.trim() || 'Surface'
        const viewLabel = this.elements['active-view']
        if (viewLabel.textContent !== label) viewLabel.textContent = label
        for (const button of this.debugButtons)
        {
            const view = Number(button.dataset.view)
            const reason = configs ? debugViewUnavailableReason(view, configs) : ''
            button.disabled = disabled || Boolean(reason)
            button.title = reason || debugViewSources[view] || button.textContent
            button.setAttribute('aria-pressed', String(view === activeView))
            if (reason) button.setAttribute('aria-description', reason)
            else button.removeAttribute('aria-description')
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
        this.elements['bernstein-control'].querySelector('input').disabled = configs.marchingMethod !== 'digitalDifferentialAnalyzer'
        this.updateDebugControls()
        if (this.variantMethod !== configs.skippingMethod) this.populateVariants()

        if (!quality) return

        this.counterLegend.update(this.experience.world.viewer.material.uniforms.u_debug.value)
        for (const button of this.qualityButtons)
            button.setAttribute('aria-pressed', String(button.dataset.quality === quality))

        const { dimensions, spacing } = computes.volumeMap

        if (this.variantVolume !== computes.volume || this.variantTimingKey !== computes.timingKey(configs.downscaleFactor))
            this.elements['variant-result'].textContent = ''

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
        const cameraUnavailable = !this.experience?.ready || this.experience.measuringVariants
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
