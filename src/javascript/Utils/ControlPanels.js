export default class ControlPanels
{
    constructor(tablist, signal)
    {
        this.tabs = Array.from(tablist.querySelectorAll('[role="tab"]'), tab => ({
            tab,
            panel: tab.ownerDocument.getElementById(tab.getAttribute('aria-controls')),
        }))
        const vertical = tablist.getAttribute('aria-orientation') === 'vertical'
        const previous = vertical ? 'ArrowUp' : 'ArrowLeft'
        const next = vertical ? 'ArrowDown' : 'ArrowRight'

        tablist.addEventListener('click', event => {
            const tab = event.target.closest('[role="tab"]')
            if (tab) this.select(tab.getAttribute('aria-controls'))
        }, { signal })

        tablist.addEventListener('keydown', event => {
            const index = this.tabs.findIndex(({ tab }) => tab === event.target)
            if (index < 0) return
            const last = this.tabs.length - 1
            const destinations = {
                [previous]: index > 0 ? index - 1 : last,
                [next]: index < last ? index + 1 : 0,
                Home: 0,
                End: last,
            }
            const destination = destinations[event.key]
            if (!Number.isInteger(destination)) return
            event.preventDefault()
            this.select(this.tabs[destination].panel.id, true)
        }, { signal })
    }

    select(panelId, focus = false)
    {
        const selected = this.tabs.find(({ panel }) => panel.id === panelId)
        if (!selected) return

        for (const item of this.tabs)
        {
            const active = item === selected
            item.tab.setAttribute('aria-selected', String(active))
            item.tab.tabIndex = active ? 0 : -1
            item.panel.hidden = !active
        }

        if (focus) selected.tab.focus()
    }
}
