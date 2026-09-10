import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'sunsprite-info-panel-fields'

export type InfoFieldKey = 'mouse' | 'camera' | 'screen' | 'clock'

export const infoFieldLabels: Record<InfoFieldKey, string> = {
    mouse: 'Mouse',
    clock: 'Clock',
    screen: 'Screen',
    camera: 'Camera',
    // screenBounds: 'Screen Bounds',
    // frame: 'Frame',
    // deltaMs: 'Delta (ms)',
}

export const infoFieldOrder = Object.keys(infoFieldLabels) as InfoFieldKey[]

const defaultVisible: Record<InfoFieldKey, boolean> = {
    mouse: true,
    screen: true,
    camera: true,
    clock: true,
}

function loadVisible(): Record<InfoFieldKey, boolean> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { ...defaultVisible }
        return { ...defaultVisible, ...JSON.parse(raw) }
    } catch {
        return { ...defaultVisible }
    }
}

// Shared between OutputPane.vue (the customize button, up in the tab header)
// and InfoPanel.vue (the fields it toggles), so the button doesn't have to
// live inside the panel it's controlling.
export const useInfoPanelStore = defineStore('infoPanel', () => {
    const visible = ref<Record<InfoFieldKey, boolean>>(loadVisible())

    watch(visible, (value) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    }, { deep: true })

    function setVisible(key: InfoFieldKey, value: boolean) {
        visible.value[key] = value
    }

    return { visible, setVisible }
})
