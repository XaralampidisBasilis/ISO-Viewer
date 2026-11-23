export default class ControlPanels
{
    constructor(tablist, onSelect, signal)
    {
        this.tabs = Array.from(tablist.querySelectorAll('[role="tab"]'), tab => ({
            tab,
            panel: tab.ownerDocument.getElementById(tab.getAttribute('aria-controls')),
        }))
        this.onSelect = onSelect

        tablist.addEventListener('click', event => {
            const tab = event.target.closest('[role="tab"]')
            if (tab) this.select(tab.getAttribute('aria-controls'))
        }, { signal })

        tablist.addEventListener('keydown', event => {
            const visible = this.tabs.filter(({ tab }) => !tab.hidden)
            const index = visible.findIndex(({ tab }) => tab === event.target)
            if (index < 0) return
            const last = visible.length - 1
            const destinations = {
                ArrowLeft: index > 0 ? index - 1 : last,
                ArrowRight: index < last ? index + 1 : 0,
                Home: 0,
                End: last,
            }
            const next = destinations[event.key]
            if (!Number.isInteger(next)) return
            event.preventDefault()
            this.select(visible[next].panel.id, true)
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

        this.onSelect(panelId)
        if (focus) selected.tab.focus()
    }
}
