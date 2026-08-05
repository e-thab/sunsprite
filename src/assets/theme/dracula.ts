import type { ThemePalette } from "./themes";

const dracula: ThemePalette = {
    // Authentic Dracula (draculatheme.com) palette.
    id: 'dracula',
    label: 'Dracula',
    isLight: false,
    bg: '#191a21',
    bgMuted: '#282a36',
    bgElevated: '#2f3241',
    bgAccented: '#44475a',
    bgInverted: '#ffffff',
    border: '#44475a',
    textDimmed: '#44475a',
    textMuted: '#6272a4',
    textToned: '#6272a4',
    text: '#f8f8f2',
    textHighlighted: '#ffffff',
    textInverted: '#191a21',
    primary: '#bd93f9',
    secondary: '#ff79c6',
    success: '#50fa7b',
    warning: '#ffb86c',
    error: '#ff5555',
    info: '#8be9fd',
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

export default dracula