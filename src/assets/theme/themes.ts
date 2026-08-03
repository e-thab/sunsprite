import type * as monaco from 'monaco-editor'

export type ThemeId = 'nord' | 'dracula' | 'monokai' | 'github-light'

// Field names mirror Nuxt UI's own semantic color slots 1:1 (bg/bg-muted/
// bg-elevated/bg-accented/bg-inverted, text/text-dimmed/text-muted/
// text-toned/text-highlighted/text-inverted) so base.css's --ui-* mapping
// can be a direct passthrough instead of cross-wiring unrelated slots
// (e.g. the old --ui-bg-inverted borrowing --theme-text-highlighted).
export interface ThemePalette {
    id: ThemeId
    label: string
    /** Drives Monaco's base theme (vs vs vs-dark) and the app's dark/light class. */
    isLight: boolean

    bg: string
    bgMuted: string
    bgElevated: string
    bgAccented: string
    bgInverted: string
    border: string

    textDimmed: string
    textMuted: string
    textToned: string
    text: string
    textHighlighted: string
    textInverted: string

    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    info: string
}

// #88c0d0 Original primary
// #52ddba Good alt primary
// #d84836 Nice orange
// #df965a Another orange
// #eda952 Yellow
// #f6436b Pink

export const themes: ThemePalette[] = [
    {
        // Authentic Nord (nordtheme.com) palette.
        id: 'nord',
        label: 'Nord',
        isLight: false,
        bg: '#23252b',
        bgMuted: '#252a33',
        bgElevated: '#2e3440',
        bgAccented: '#353b48',
        bgInverted: '#eceff4',
        border: '#434c5e',
        textDimmed: '#434c5e',
        textMuted: '#4c566a',
        textToned: '#6a758d',
        text: '#d8dee9',
        textHighlighted: '#eceff4',
        textInverted: '#23252b',
        primary: '#8fbcbb',
        secondary: '#5e81ac',
        success: '#a3be8c',
        warning: '#ebcb8b',
        error: '#bf616a',
        info: '#81a1c1',
    },
    {
        // Authentic Dracula (draculatheme.com) palette.
        id: 'dracula',
        label: 'Dracula',
        isLight: false,
        bg: '#191a21',
        bgMuted: '#282a36',
        bgElevated: '#2f3241',
        bgAccented: '#44475a',
        bgInverted: '#ffffff',
        border: '#44475a',
        textDimmed: '#44475a',
        textMuted: '#6272a4',
        textToned: '#6272a4',
        text: '#f8f8f2',
        textHighlighted: '#ffffff',
        textInverted: '#191a21',
        primary: '#bd93f9',
        secondary: '#ff79c6',
        success: '#50fa7b',
        warning: '#ffb86c',
        error: '#ff5555',
        info: '#8be9fd',
    },
    {
        // Authentic Monokai palette.
        id: 'monokai',
        label: 'Monokai',
        isLight: false,
        bg: '#1e1f1c',
        bgMuted: '#272822',
        bgElevated: '#2e2f2a',
        bgAccented: '#49483e',
        bgInverted: '#ffffff',
        border: '#49483e',
        textDimmed: '#49483e',
        textMuted: '#75715e',
        textToned: '#75715e',
        text: '#f8f8f2',
        textHighlighted: '#ffffff',
        textInverted: '#1e1f1c',
        primary: '#66d9ef',
        secondary: '#ae81ff',
        success: '#a6e22e',
        warning: '#fd971f',
        error: '#f92672',
        info: '#e6db74',
    },
    {
        // Modeled on GitHub's light UI palette.
        id: 'github-light',
        label: 'GitHub Light',
        isLight: true,
        bg: '#ffffff',
        bgMuted: '#f6f8fa',
        bgElevated: '#eaeef2',
        bgAccented: '#d0d7de',
        bgInverted: '#10161c',
        border: '#d0d7de',
        textDimmed: '#d0d7de',
        textMuted: '#656d76',
        textToned: '#6e7781',
        text: '#1f2328',
        textHighlighted: '#10161c',
        textInverted: '#ffffff',
        primary: '#0969da',
        secondary: '#8250df',
        success: '#1a7f37',
        warning: '#9a6700',
        error: '#d1242f',
        info: '#1b7c83',
    },
]

export const defaultThemeId: ThemeId = 'nord'

export function findTheme(id: string | null | undefined): ThemePalette {
    return themes.find((t) => t.id === id) ?? themes.find((t) => t.id === defaultThemeId)!
}

export function monacoThemeName(id: ThemeId): string {
    return `sunsprite-${id}`
}

// Projects a palette into the editor-chrome colors Monaco needs.
// One source of truth for both the app CSS variables and the editor theme.
export function buildMonacoThemeData(palette: ThemePalette): monaco.editor.IStandaloneThemeData {
    return {
        base: palette.isLight ? 'vs' : 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': palette.bgElevated,
            'editor.lineHighlightBackground': palette.isLight ? '#00000008' : '#ffffff08',
            'editorLineNumber.foreground': `${palette.text}44`,
            'editorLineNumber.activeForeground': palette.text,
            'editorWidget.background': palette.bgMuted,
            'dropdown.background': palette.bgMuted,
            'scrollbar.shadow': '#00000044',
        },
    }
}
