import type * as monaco from 'monaco-editor'

export type ThemeId = 'nord' | 'dracula' | 'monokai' | 'github-light'

export interface ThemePalette {
    id: ThemeId
    label: string
    /** Drives Monaco's base theme (vs vs vs-dark) and the app's dark/light class. */
    isLight: boolean

    backgroundDarker: string
    backgroundDark: string
    backgroundNeutral: string
    backgroundLight: string
    border: string

    textDim: string
    textBright: string
    textHighlighted: string
    // General-purpose mid-tone accents: dividers, hover backgrounds, and
    // (via base.css) the two dimmest Nuxt UI text tiers.
    scrollNeutral: string
    scrollLight: string

    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    info: string
}

export const themes: ThemePalette[] = [
    {
        // Authentic Nord (nordtheme.com) palette.
        id: 'nord',
        label: 'Nord',
        isLight: false,
        backgroundDarker: '#23252b',
        backgroundDark: '#252a33',
        backgroundNeutral: '#2e3440',
        backgroundLight: '#353b48',
        border: '#434c5e',
        textDim: '#4a546a',
        textBright: '#d8dee9',
        textHighlighted: '#eceff4',
        scrollNeutral: '#434c5e',
        scrollLight: '#4c566a',
        primary: '#88c0d0',
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
        backgroundDarker: '#191a21',
        backgroundDark: '#282a36',
        backgroundNeutral: '#2f3241',
        backgroundLight: '#44475a',
        border: '#44475a',
        textDim: '#6272a4',
        textBright: '#f8f8f2',
        textHighlighted: '#ffffff',
        scrollNeutral: '#44475a',
        scrollLight: '#6272a4',
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
        backgroundDarker: '#1e1f1c',
        backgroundDark: '#272822',
        backgroundNeutral: '#2e2f2a',
        backgroundLight: '#49483e',
        border: '#49483e',
        textDim: '#75715e',
        textBright: '#f8f8f2',
        textHighlighted: '#ffffff',
        scrollNeutral: '#49483e',
        scrollLight: '#75715e',
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
        backgroundDarker: '#ffffff',
        backgroundDark: '#f6f8fa',
        backgroundNeutral: '#eaeef2',
        backgroundLight: '#d0d7de',
        border: '#d0d7de',
        textDim: '#6e7781',
        textBright: '#1f2328',
        textHighlighted: '#10161c',
        scrollNeutral: '#d0d7de',
        scrollLight: '#656d76',
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
            'editor.background': palette.backgroundNeutral,
            'editor.lineHighlightBackground': palette.isLight ? '#00000008' : '#ffffff08',
            'editorLineNumber.foreground': `${palette.textBright}44`,
            'editorLineNumber.activeForeground': palette.textBright,
            'editorWidget.background': palette.backgroundDark,
            'dropdown.background': palette.backgroundDark,
            'scrollbar.shadow': '#00000044',
        },
    }
}
