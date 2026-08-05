import type { ThemePalette } from "./themes";

const oneDark: ThemePalette = {
    // Authentic Atom One Dark palette.
    id: 'onedark',
    label: 'One Dark',
    isLight: false,
    bg: '#1b1d23',
    bgMuted: '#282c34',
    bgElevated: '#2c313a',
    bgAccented: '#3b4048',
    bgInverted: '#fafafa',
    border: '#3b4048',
    textDimmed: '#3b4048',
    textMuted: '#5c6370',
    textToned: '#828997',
    text: '#abb2bf',
    textHighlighted: '#ffffff',
    textInverted: '#282c34',
    primary: '#61afef',
    secondary: '#c678dd',
    success: '#98c379',
    warning: '#e5c07b',
    error: '#e06c75',
    info: '#56b6c2',
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

export default oneDark