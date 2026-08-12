import type { ThemePalette } from "./themes"

// Authentic Nord (nordtheme.com) palette.
const nord: ThemePalette = {
    id: 'nord',
    label: 'Nord',
    isLight: false,
    bg: '#212631',
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
    tokens: {
        default: { color: '#d8dee9' },
        identifier: { color: '#d8dee9' },
        keyword: { color: '#81a1c1' },
        delimiter: { color: '#d8dee9' },
        type: { color: '#8fbcbb', style: 'bold' },
        number: { color: '#b48ead' },
        numberHex: { color: '#d08770' },
        string: { color: '#a3be8c' },
        stringEscape: { color: '#d08770' },
        comment: { color: '#818a9b', style: 'italic' }, // Not a true nord color, but mimics comments in nordtheme.com examples
        commentDoc: { color: '#ebcb8b' },
        regexp: { color: '#d08770' },
        bracketColor1: '#5e81ac',
        bracketColor2: '#ebcb8b',
        bracketColor3: '#b48ead',
        bracketColorUnexpected: '#bf616a',
    }
}

export default nord