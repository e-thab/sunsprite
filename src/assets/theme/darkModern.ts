import type { ThemePalette } from "./themes";

// VSCode's Dark Modern, its default dark theme since 1.81
// (microsoft/vscode: extensions/theme-defaults/themes/dark_modern.json).
// Dark Modern only restyles the workbench; its syntax colors are inherited
// unchanged from Dark+ (dark_plus.json, itself layered on dark_vs.json).
//
// The syntax and accent colors are Dark Modern's own. The background, border
// and text shades are not: Dark Modern's are dark and high-contrast, so each
// is lifted to the perceived lightness (OKLab L) of the matching shade in
// oneDark.ts. Dark Modern's greys are perfectly neutral; these carry a slight
// cool tint instead (OKLCH chroma 0.008 at hue 255, the direction of Dark
// Modern's few off-grey colors like #6e7681, and about half of One Dark's own
// tint). Each is annotated with the One Dark shade it matches and the Dark
// Modern color it replaces.
const darkModern: ThemePalette = {
    id: 'dark-modern',
    label: 'Dark Modern',
    isLight: false,
    bg: '#1d1f23', // One Dark #1d1f23 (the tint happens to land exactly on it); was #181818 (sideBar / panel / titleBar.background)
    bgMuted: '#232529', // One Dark #21252b; was #181818 (editorGroupHeader.tabsBackground)
    bgElevated: '#292c30', // One Dark #282c34; was #1f1f1f (editor.background)
    bgAccented: '#35383c', // One Dark #323842; was #2b2b2b (panel.border / sideBar.border)
    bgInverted: '#afb2b7', // same as text, as in One Dark
    border: '#414448', // One Dark #3e4452; was #3c3c3c (input.border / dropdown.border)
    textDimmed: '#4e5156', // One Dark #495162; was #6e7681 (editorLineNumber.foreground)
    textMuted: '#606368', // One Dark #5c6370; was #868686 (activityBar.inactiveForeground)
    textToned: '#86898e', // One Dark #828997; was #9d9d9d (descriptionForeground)
    text: '#afb2b7', // One Dark #abb2bf; was #cccccc (foreground)
    textHighlighted: '#d7dadf', // One Dark #d7dae0; was #ffffff (tab.activeForeground)
    textInverted: '#292c30', // bgElevated
    primary: '#52dfbb', // 52dfbb 
    secondary: '#0078d4', // focusBorder / button.background
    success: '#43c55b', // editorGutter.addedBackground
    warning: '#ffca58', // editorWarning.foreground (VSCode's dark default; Dark Modern doesn't override it)
    error: '#ff746d', // errorForeground
    info: '#3794ff', // editorInfo.foreground (VSCode's dark default)
    tokens: {
        default: { color: '#cccccc' }, // editor.foreground, for anything unscoped
        identifier: { color: '#9cdcfe' }, // variable
        keyword: { color: '#569cd6' }, // keyword, storage
        keywordControl: { color: '#c586c0' }, // keyword.control
        literal: { color: '#569cd6' }, // constant.language
        delimiter: { color: '#cccccc' }, // punctuation (unstyled in Dark+)
        operator: { color: '#d4d4d4' }, // keyword.operator
        type: { color: '#4ec9b0' }, // entity.name.type, support.class
        function: { color: '#dcdcaa' }, // entity.name.function
        property: { color: '#9cdcfe' }, // variable.other.property, meta.object-literal.key
        parameter: { color: '#9cdcfe' }, // variable.parameter
        constant: { color: '#4fc1ff' }, // variable.other.constant, variable.other.enummember
        number: { color: '#b5cea8' }, // constant.numeric
        numberHex: { color: '#b5cea8' },
        string: { color: '#ce9178' },
        stringEscape: { color: '#d7ba7d' }, // constant.character.escape
        comment: { color: '#6a9955' },
        commentDoc: { color: '#6a9955' },
        regexp: { color: '#d16969' }, // string.regexp
        // VSCode's built-in bracket pair colors, which Dark Modern keeps
        bracketColor1: '#ffd700',
        bracketColor2: '#da70d6',
        bracketColor3: '#179fff',
        bracketColorUnexpected: '#ff1212cc',
    }
}

export default darkModern
