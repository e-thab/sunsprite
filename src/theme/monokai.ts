import type { ThemePalette } from "./themes";

// ! Currently disabled

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
        default: { color: '#' },
        identifier: { color: '#' },
        keyword: { color: '#' },
        delimiter: { color: '#' },
        type: { color: '#' },
        number: { color: '#' },
        numberHex: { color: '#' },
        string: { color: '#' },
        stringEscape: { color: '#' },
        comment: { color: '#' },
        commentDoc: { color: '#' },
        regexp: { color: '#' },
        bracketColor1: '#',
        bracketColor2: '#',
        bracketColor3: '#',
        bracketColorUnexpected: '#',
    }
}

export default monokai