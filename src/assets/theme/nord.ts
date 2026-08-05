import type { ThemePalette } from "./themes"

// Authentic Nord (nordtheme.com) palette.
const nord: ThemePalette = {
    id: 'nord',
    label: 'Nord',
    isLight: false,
    bg: '#2e3440',
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
        default: { color: '#eceff4', style: '' },
        keyword: { color: '#5e81ac', style: '' },
        comment: { color: '#a3be8c', style: '' },
        type: { color: '#8fbcbb', style: '' },
        number: { color: '#b48ead', style: '' },
        numberHex: { color: '#b48ead', style: '' },
        string: { color: '#d08770', style: '' },
        regexp: { color: '#88c0d0', style: '' },
        bracketColor1: '#ebcb8b',
        bracketColor2: '#b48ead',
        bracketColor3: '#88c0d0',
        bracketColorUnexpected: '#bf616a',
    }
}

export default nord