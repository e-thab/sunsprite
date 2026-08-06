import type { ThemePalette } from "./themes";

const dracula: ThemePalette = {
    // Authentic Dracula (draculatheme.com) palette.
    id: 'dracula',
    label: 'Dracula',
    isLight: false,
    bg: '#191a21',  // Bogus
    bgMuted: '#212331', // Bogus
    bgElevated: '#282a36',
    bgAccented: '#333646', // Bogus
    bgInverted: '#f8f8f2',
    border: '#44475a',
    textDimmed: '#44475a',
    textMuted: '#6272a4',
    textToned: '#6272a4',
    text: '#f8f8f2',
    textHighlighted: '#ffffff',
    textInverted: '#191a21', // Bogus
    primary: '#bd93f9',
    secondary: '#ff79c6',
    success: '#50fa7b',
    warning: '#ffb86c',
    error: '#ff5555',
    info: '#8be9fd',
    tokens: {
        default: { color: '#f8f8f2' },
        identifier: { color: '#f8f8f2' },
        keyword: { color: '#ff79c6' },
        delimiter: { color: '#f8f8f2' },
        type: { color: '#8be9fd', style: 'bold' },
        number: { color: '#bd93f9' },
        numberHex: { color: '#ffb86c' },
        string: { color: '#50fa7b' },
        stringEscape: { color: '#ffb86c' },
        comment: { color: '#6272a4', style: 'italic' },
        commentDoc: { color: '#ff79c6' },
        regexp: { color: '#ffb86c' },
        bracketColor1: '#bd93f9',
        bracketColor2: '#ffb86c',
        bracketColor3: '#50fa7b',
        bracketColorUnexpected: '#ff5555',
    }
}

export default dracula