import type { ThemePalette } from "./themes";

const oneDark: ThemePalette = {
    // Authentic Atom One Dark palette.
    id: 'onedark',
    label: 'One Dark',
    isLight: false,
    bg: '#1b1d23', // Bogus
    bgMuted: '#1c1f25',
    bgElevated: '#282c34', // Bogus
    bgAccented: '#343a44', // Bogus
    bgInverted: '#abb2bf',
    border: '#3b4048', // Bogus
    textDimmed: '#3b4048', // Bogus
    textMuted: '#5c6370', // Bogus
    textToned: '#828997', // Bogus
    text: '#abb2bf',
    textHighlighted: '#fafafa', // Bogus
    textInverted: '#282c34',
    primary: '#61afef',
    secondary: '#c678dd',
    success: '#98c379',
    warning: '#e5c07b',
    error: '#e06c75',
    info: '#56b6c2',
    tokens: {
        default: { color: '#fafafa' },
        identifier: { color: '#fafafa' },
        keyword: { color: '#c678dd' },
        delimiter: { color: '#fafafa' },
        type: { color: '#e5c07b', style: 'bold' },
        number: { color: '#61afef' },
        numberHex: { color: '#c678dd' },
        string: { color: '#98c379' },
        stringEscape: { color: '#ffffff' },
        comment: { color: '#ffffff' },
        commentDoc: { color: '#ffffff' },
        regexp: { color: '#ffffff' },
        bracketColor1: '#ffffff',
        bracketColor2: '#ffffff',
        bracketColor3: '#ffffff',
        bracketColorUnexpected: '#ffffff',
    }
}

export default oneDark