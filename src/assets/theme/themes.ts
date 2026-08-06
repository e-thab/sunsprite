import type * as monaco from 'monaco-editor'
import nord from './nord'
import dracula from './dracula'
import monokai from './monokai'
import gruvbox from './gruvbox'
import oneDark from './oneDark'
import tokyoNight from './tokyoNight'
import gitHubLight from './gitHubLight'
import alucard from './alucard'

export type ThemeId =
    | 'nord'
    | 'dracula'
    | 'monokai'
    | 'github-light'
    | 'gruvbox'
    | 'onedark'
    | 'tokyo-night-storm'
    | 'alucard'

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

    /** Default component/page backgrounds */
    bg: string
    /** Panel header bar backgrounds, not currently used within Nuxt components */
    bgMuted: string
    /** Panel primary backgrounds and Nuxt item hover highlight */
    bgElevated: string
    /** Navbar and splitter color, not currently used within Nuxt components */
    bgAccented: string
    /** Not currently used */
    bgInverted: string
    
    /** Nuxt component borders, file tree lines */
    border: string

    /** Nuxt non-selected dropdown items */
    textDimmed: string
    /** Splitter hover color, output 'running' item, and Nuxt 'detail' text (inactive tab labels, time-ago, etc.) */
    textMuted: string
    /** Currently only used for 'running' item stamp and 'last edited' tags on project page */
    textToned: string
    /** Primary text color, selected icons, and Monaco line numbers */
    text: string
    /** Text on hovered Nuxt items */
    textHighlighted: string
    /** Used for text within Nuxt components with solid variant */
    textInverted: string

    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    info: string

    tokens: TokenPalette
}

// Color palette for monaco tokenization/syntax highlighting
interface TokenColorDefinition {
    color: string,
    bgColor?: string,
    style?: string
}
export interface TokenPalette {
    default: TokenColorDefinition,
    identifier: TokenColorDefinition,
    keyword: TokenColorDefinition,
    delimiter: TokenColorDefinition,
    type: TokenColorDefinition,
    number: TokenColorDefinition,
    numberHex: TokenColorDefinition
    string: TokenColorDefinition,
    stringEscape: TokenColorDefinition,
    comment: TokenColorDefinition,
    commentDoc: TokenColorDefinition,
    regexp: TokenColorDefinition,
    bracketColor1: string,
    bracketColor2: string,
    bracketColor3: string,
    bracketColorUnexpected: string
}

// #88c0d0 Original primary
// #52ddba Good alt primary
// #d84836 Nice orange
// #df965a Another orange
// #eda952 Yellow
// #f6436b Pink

export const themes: ThemePalette[] = [
    // Dark
    nord, dracula, /*monokai,*/ /*gruvbox,*/ oneDark, tokyoNight,
    // Light
    alucard, gitHubLight
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
// https://code.visualstudio.com/api/references/theme-color
// https://code.visualstudio.com/docs/configure/themes#_customize-a-color-theme:~:text=Editor%20syntax%20highlighting
export function buildMonacoThemeData(palette: ThemePalette): monaco.editor.IStandaloneThemeData {
    const tokenMap: Map<string, TokenColorDefinition> = new Map([
        ['', palette.tokens.default],
        ['identifier', palette.tokens.identifier],
        ['keyword', palette.tokens.keyword],
        ['delimiter', palette.tokens.delimiter],
        ['type', palette.tokens.type],
        ['number', palette.tokens.number],
        ['number.hex', palette.tokens.numberHex],
        ['string', palette.tokens.string],
        ['string.escape', palette.tokens.stringEscape],
        ['comment', palette.tokens.comment],
        ['comment.doc', palette.tokens.commentDoc],
        ['regexp', palette.tokens.regexp],
    ])
    

    const rules: monaco.editor.ITokenThemeRule[] = []
    for (const [name, palette] of tokenMap.entries()) {
        rules.push({
            token: name,
            foreground: palette.color,
            fontStyle: palette.style
        })
    }

    return {
        base: palette.isLight ? 'vs' : 'vs-dark',
        inherit: true,
        rules,
        colors: {
            'editor.background': palette.bgElevated,
            'editor.lineHighlightBackground': palette.isLight ? '#00000008' : '#ffffff08',
            'editorLineNumber.foreground': `${palette.text}44`,
            'editorLineNumber.activeForeground': palette.text,
            'editorWidget.background': palette.bgMuted,
            'dropdown.background': palette.bgMuted,
            'scrollbar.shadow': '#00000044',
            "editorBracketHighlight.foreground1": palette.tokens.bracketColor1, // Innermost
            "editorBracketHighlight.foreground2": palette.tokens.bracketColor2,
            "editorBracketHighlight.foreground3": palette.tokens.bracketColor3,
            "editorBracketHighlight.unexpectedBracket.foreground": palette.tokens.bracketColorUnexpected // Mismatched
        },
    }
}
