import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/assets/utils/supabase";
import { useAuthStore } from "./authStore";
import { themes, findTheme, defaultThemeId, type ThemeId, type ThemePalette } from "@/assets/theme/themes";

const STORAGE_KEY = 'sunsprite-theme'

export const useThemeStore = defineStore('theme', () => {
    const currentId = ref<ThemeId>(defaultThemeId)
    const current = computed<ThemePalette>(() => findTheme(currentId.value))

    function applyToDocument(palette: ThemePalette) {
        const html = document.documentElement
        html.classList.toggle('dark', !palette.isLight)
        html.classList.toggle('light', palette.isLight)

        const root = html.style
        root.setProperty('--theme-bg', palette.bg)
        root.setProperty('--theme-bg-muted', palette.bgMuted)
        root.setProperty('--theme-bg-elevated', palette.bgElevated)
        root.setProperty('--theme-bg-accented', palette.bgAccented)
        root.setProperty('--theme-bg-inverted', palette.bgInverted)
        root.setProperty('--theme-border', palette.border)
        root.setProperty('--theme-text-dimmed', palette.textDimmed)
        root.setProperty('--theme-text-muted', palette.textMuted)
        root.setProperty('--theme-text-toned', palette.textToned)
        root.setProperty('--theme-text', palette.text)
        root.setProperty('--theme-text-highlighted', palette.textHighlighted)
        root.setProperty('--theme-text-inverted', palette.textInverted)
        root.setProperty('--theme-primary', palette.primary)
        root.setProperty('--theme-secondary', palette.secondary)
        root.setProperty('--theme-success', palette.success)
        root.setProperty('--theme-warning', palette.warning)
        root.setProperty('--theme-error', palette.error)
        root.setProperty('--theme-info', palette.info)
    }

    // Sets the active theme, persists it (localStorage always, plus the
    // signed-in user's profile so it follows their account), and applies
    // it to the document. Monaco's theme is switched separately by
    // CodeEditor.vue, which watches `currentId` — keeps the (large)
    // monaco-editor import out of this store for routes that never load it.
    async function setTheme(id: ThemeId) {
        currentId.value = id
        applyToDocument(current.value)
        localStorage.setItem(STORAGE_KEY, id)

        const authStore = useAuthStore()
        if (authStore.user) {
            const { error } = await supabase.from('profiles').update({ theme: id }).eq('id', authStore.user.id)
            if (error) console.error('Failed to save theme preference', error)
        }
    }

    // Re-runnable (unlike authStore.init): call again after sign-in/sign-out
    // so the active theme reflects whichever preference source applies now.
    async function init() {
        const authStore = useAuthStore()
        await authStore.ready

        let id: string | null = null
        if (authStore.user) {
            const { data } = await supabase
                .from('profiles')
                .select('theme')
                .eq('id', authStore.user.id)
                .maybeSingle()
            id = data?.theme ?? null
        }
        if (!id) id = localStorage.getItem(STORAGE_KEY)

        currentId.value = findTheme(id).id
        applyToDocument(current.value)
    }

    return { themes, currentId, current, setTheme, init }
})
