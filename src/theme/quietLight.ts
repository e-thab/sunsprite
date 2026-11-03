import type { ThemePalette } from "./themes";

// VSCode's built-in Quiet Light
// (microsoft/vscode: extensions/theme-quietlight/themes/quietlight-color-theme.json).
// Where Quiet Light leaves a color unset, VSCode's own light-theme default
// fills in, which is what Quiet Light users see too. Each value is annotated
// with the theme color or TextMate scope it comes from.
const quietLight: ThemePalette = {
    id: 'quiet-light',
    label: 'Quiet Light',
    isLight: true,
    bg: '#f2f2f2', // sideBar.background
    bgMuted: '#ede8ef', // sideBarSectionHeader.background
    bgElevated: '#f5f5f5', // editor.background
    bgAccented: '#c4b7d7', // titleBar.activeBackground
    bgInverted: '#333333', // default text
    border: '#c9d0d9', // panelSection.border / sideBarSectionHeader.border
    textDimmed: '#aaaaaa', // editorWhitespace.foreground / comment
    textMuted: '#777777', // punctuation
    textToned: '#54494b', // tab.inactiveForeground
    text: '#333333', // default text
    textHighlighted: '#000000',
    textInverted: '#f5f5f5', // editor.background
    primary: '#705697', // statusBar / button / activityBar.foreground
    secondary: '#9769dc', // focusBorder / list.highlightForeground
    success: '#448c27', // string
    warning: '#bf8803', // editorWarning.foreground (VSCode's light default)
    // Quiet Light's own errorForeground (#f1897f) is too pale to read as text
    // on its backgrounds, and it doesn't set editorError.foreground, so its
    // squiggles are VSCode's light default, which this follows.
    error: '#e51400',
    info: '#1a85ff', // editorInfo.foreground (VSCode's light default)
    tokens: {
        default: { color: '#333333' },
        identifier: { color: '#7a3e9d' }, // variable
        // Quiet Light's two keyword colors fall the opposite way round from
        // most themes: declarations (storage.type: const, let, function,
        // class) are purple, and everything else under `keyword` is blue.
        keyword: { color: '#7a3e9d' }, // storage.type
        keywordControl: { color: '#4b69c6' }, // keyword
        literal: { color: '#9c5d27' }, // constant.language
        delimiter: { color: '#777777' }, // punctuation
        operator: { color: '#777777' }, // keyword.operator
        type: { color: '#7a3e9d', style: 'bold' }, // entity.name.type
        function: { color: '#aa3731', style: 'bold' }, // entity.name.function
        property: { color: '#7a3e9d' }, // variable.other.property
        parameter: { color: '#7a3e9d' }, // variable.parameter
        constant: { color: '#7a3e9d' }, // variable.other.constant (still under `variable`)
        number: { color: '#9c5d27' }, // constant.numeric
        numberHex: { color: '#9c5d27' },
        string: { color: '#448c27' },
        stringEscape: { color: '#777777' }, // constant.character.escape
        comment: { color: '#aaaaaa', style: 'italic' },
        // comment.block.documentation sets only the color; the italic carries
        // over from Quiet Light's `comment` rule
        commentDoc: { color: '#448c27', style: 'italic' },
        regexp: { color: '#4b69c6' }, // string.regexp
        // VSCode's built-in light bracket pair colors; Quiet Light sets none
        bracketColor1: '#0431fa',
        bracketColor2: '#319331',
        bracketColor3: '#7b3814',
        bracketColorUnexpected: '#ff1212cc',
    }
}

export default quietLight
