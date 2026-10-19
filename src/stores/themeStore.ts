import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/utils/supabase";
import { useAuthStore } from "./authStore";
import { themes, findTheme, type ThemeId, type ThemePalette } from "@/theme/themes";

const STORAGE_KEY = 'sunsprite-theme'
// Snapshot of what applyToDocument last set, for index.html's inline script
// to re-apply before anything paints. Read there by this exact name.
const PAINT_KEY = 'sunsprite-theme-paint'

function storedThemeId(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

// The CSS variables a palette is applied to the document as.
function themeVariables(palette: ThemePalette): Record<string, string> {
    return {
        '--theme-bg': palette.bg,
        '--theme-bg-muted': palette.bgMuted,
        '--theme-bg-elevated': palette.bgElevated,
        '--theme-bg-accented': palette.bgAccented,
        '--theme-bg-inverted': palette.bgInverted,
        '--theme-border': palette.border,
        '--theme-text-dimmed': palette.textDimmed,
        '--theme-text-muted': palette.textMuted,
        '--theme-text-toned': palette.textToned,
        '--theme-text': palette.text,
        '--theme-text-highlighted': palette.textHighlighted,
        '--theme-text-inverted': palette.textInverted,
        '--theme-primary': palette.primary,
        '--theme-secondary': palette.secondary,
        '--theme-success': palette.success,
        '--theme-warning': palette.warning,
        '--theme-error': palette.error,
        '--theme-info': palette.info,

        // Same syntax-token colors Monaco gets via buildMonacoThemeData
        // (themes.ts), exposed as CSS vars too so DocSnippet's manual
        // highlighting (`doc-snippet-hl-*` in docsPage.css) tracks whatever
        // editor theme is active instead of a fixed palette. Only `.color` —
        // the `style` (bold/italic) Monaco also reads isn't a CSS property
        // and has no CSS use yet.
        '--theme-token-default': palette.tokens.default.color,
        '--theme-token-identifier': palette.tokens.identifier.color,
        '--theme-token-keyword': palette.tokens.keyword.color,
        '--theme-token-delimiter': palette.tokens.delimiter.color,
        '--theme-token-type': palette.tokens.type.color,
        '--theme-token-number': palette.tokens.number.color,
        '--theme-token-number-hex': palette.tokens.numberHex.color,
        '--theme-token-string': palette.tokens.string.color,
        '--theme-token-string-escape': palette.tokens.stringEscape.color,
        '--theme-token-comment': palette.tokens.comment.color,
        '--theme-token-comment-doc': palette.tokens.commentDoc.color,
        '--theme-token-regexp': palette.tokens.regexp.color,
    }
}

export const useThemeStore = defineStore('theme', () => {
    // Starts as this device's last theme rather than the default: init() has
    // to wait on auth and then a profile fetch before it knows the account's
    // theme, which can take seconds, and anything reading this in the
    // meantime (Monaco's theme, App.vue's dark/light class) would otherwise
    // show the default for all of it.
    const currentId = ref<ThemeId>(findTheme(storedThemeId()).id)
    const current = computed<ThemePalette>(() => findTheme(currentId.value))

    function applyToDocument(palette: ThemePalette) {
        const html = document.documentElement
        html.classList.toggle('dark', !palette.isLight)
        html.classList.toggle('light', palette.isLight)

        const variables = themeVariables(palette)
        for (const [name, value] of Object.entries(variables)) {
            html.style.setProperty(name, value)
        }

        try {
            localStorage.setItem(PAINT_KEY, JSON.stringify({ isLight: palette.isLight, variables }))
        } catch {
            // Only costs the next load its pre-paint theme; it still gets the
            // right one as soon as this store initializes.
        }
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
        // Applied before waiting on anything. setTheme saves every choice
        // here as well as to the profile, so this device's last theme is
        // almost always the account's too; the profile only overrides it
        // below when it was changed somewhere else.
        currentId.value = findTheme(storedThemeId()).id
        applyToDocument(current.value)

        const authStore = useAuthStore()
        await authStore.ready
        if (!authStore.user) return

        const shownBeforeFetch = currentId.value
        const { data } = await supabase
            .from('profiles')
            .select('theme')
            .eq('id', authStore.user.id)
            .maybeSingle()
        if (!data?.theme) return

        // A theme picked while the profile was loading is newer than what the
        // profile holds, so it stands.
        if (currentId.value !== shownBeforeFetch) return

        const profileId = findTheme(data.theme).id
        if (profileId === currentId.value) return
        currentId.value = profileId
        applyToDocument(current.value)
        // So the next load on this device starts on it, not the stale one.
        try {
            localStorage.setItem(STORAGE_KEY, profileId)
        } catch {
            // Next load just repeats this correction.
        }
    }

    return { themes, currentId, current, setTheme, init }
})
