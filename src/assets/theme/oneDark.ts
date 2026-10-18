import type { ThemePalette } from "./themes";

// Atom's One Dark, as ported to VSCode by One Dark Pro (github.com/Binaryify/OneDark-Pro),
// the version most people know it from. Syntax colors are Atom's own palette
// (one-dark-syntax/styles/colors.less); UI shades are taken from One Dark
// Pro's workbench colors, since Atom derives its UI shades in LESS and never
// writes them out. Each value is annotated with where it comes from.
const oneDark: ThemePalette = {
    id: 'onedark',
    label: 'One Dark',
    isLight: false,
    bg: '#1d1f23', // input.background, the darkest surface
    bgMuted: '#21252b', // sideBar / tab bar / editorWidget.background
    bgElevated: '#282c34', // editor.background (Atom syntax-bg)
    bgAccented: '#323842', // tab.hoverBackground / list.focusBackground
    bgInverted: '#abb2bf', // mono-1
    border: '#3e4452', // panel.border / focusBorder
    textDimmed: '#495162', // editorLineNumber.foreground
    textMuted: '#5c6370', // mono-3
    textToned: '#828997', // mono-2
    text: '#abb2bf', // mono-1, editor.foreground
    textHighlighted: '#d7dae0', // list.activeSelectionForeground
    textInverted: '#282c34', // editor.background
    primary: '#61afef', // hue-2 blue
    secondary: '#c678dd', // hue-3 purple
    success: '#98c379', // hue-4 green
    warning: '#d19a66', // hue-6 orange, editorWarning.foreground
    error: '#e06c75', // hue-5 red
    info: '#56b6c2', // hue-1 cyan
    tokens: {
        default: { color: '#abb2bf' }, // punctuation and anything unscoped
        identifier: { color: '#e06c75' }, // variable
        keyword: { color: '#c678dd' }, // keyword, storage
        // One Dark doesn't separate control-flow keywords; set so it's clear
        // that's deliberate rather than a missing entry.
        keywordControl: { color: '#c678dd' },
        literal: { color: '#d19a66' }, // constant.language
        delimiter: { color: '#abb2bf' }, // punctuation
        operator: { color: '#56b6c2' }, // keyword.operator.*
        type: { color: '#e5c07b' }, // entity.name.type, support.class
        function: { color: '#61afef' }, // entity.name.function
        property: { color: '#e06c75' }, // variable.other.property, meta.object-literal.key
        parameter: { color: '#e06c75', style: 'italic' }, // variable.parameter
        constant: { color: '#e5c07b' }, // variable.other.constant, variable.defaultLibrary
        number: { color: '#d19a66' }, // constant.numeric
        numberHex: { color: '#d19a66' },
        string: { color: '#98c379' },
        stringEscape: { color: '#56b6c2' }, // constant.character.escape
        comment: { color: '#7f848e', style: 'italic' }, // One Dark Pro's; Atom's is mono-3
        commentDoc: { color: '#7f848e', style: 'italic' },
        regexp: { color: '#e06c75' }, // string.regexp
        bracketColor1: '#d19a66', // editorBracketHighlight.foreground1..3
        bracketColor2: '#c678dd',
        bracketColor3: '#56b6c2',
        bracketColorUnexpected: '#e06c75', // One Dark Pro sets none; hue-5 red
    }
}

export default oneDark
