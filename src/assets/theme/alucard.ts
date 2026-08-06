import type { ThemePalette } from "./themes";

const alucard: ThemePalette = {
    // Authentic Alucard (draculatheme.com) palette.
    id: 'alucard',
    label: 'Alucard',
    isLight: true,
    bg: '#e6dfc0',
    bgMuted: '#efe9cf',
    bgElevated: '#fffbeb',
    bgAccented: '#cabf94',
    bgInverted: '#1f1f1f',
    border: '#6c664b',
    textDimmed: '#6c664b',
    textMuted: '#6c664b',
    textToned: '#6c664b',
    text: '#1f1f1f',
    textHighlighted: '#000000',
    textInverted: '#e6dfc0',
    primary: '#644ac9',
    secondary: '#a3144d',
    success: '#14710a',
    warning: '#a34d14',
    error: '#cb3a2a',
    info: '#036a96',
    tokens: {
        default: { color: '#1f1f1f' },
        identifier: { color: '#1f1f1f' },
        keyword: { color: '#a3144d' },
        delimiter: { color: '#1f1f1f' },
        type: { color: '#036a96', style: 'bold' },
        number: { color: '#644ac9' },
        numberHex: { color: '#a34d14' },
        string: { color: '#14710a' },
        stringEscape: { color: '#a34d14' },
        comment: { color: '#6c664b', style: 'italic' },
        commentDoc: { color: '#a3144d' },
        regexp: { color: '#a34d14' },
        bracketColor1: '#644ac9',
        bracketColor2: '#a34d14',
        bracketColor3: '#14710a',
        bracketColorUnexpected: '#cb3a2a',
    }
}

export default alucard