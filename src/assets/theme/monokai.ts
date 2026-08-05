import type { ThemePalette } from "./themes";


const monokai: ThemePalette = {
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
    tokens: {
        default: { color: '#', style: '' },
        keyword: { color: '#', style: '' },
        comment: { color: '#', style: '' },
        type: { color: '#', style: '' },
        number: { color: '#', style: '' },
        numberHex: { color: '#', style: '' },
        string: { color: '#', style: '' },
        regexp: { color: '#', style: '' },
        bracketColor1: '#',
        bracketColor2: '#',
        bracketColor3: '#',
        bracketColorUnexpected: '#',
    }
}

export default monokai