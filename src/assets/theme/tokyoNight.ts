import type { ThemePalette } from "./themes";

const tokyoNight: ThemePalette = {
    // Authentic Tokyo Night (Storm variant) palette.
    id: 'tokyo-night',
    label: 'Tokyo Night',
    isLight: false,
    bg: '#1f2335',
    bgMuted: '#24283b',
    bgElevated: '#292e42',
    bgAccented: '#3b4261',
    bgInverted: '#e1e2e7',
    border: '#3b4261',
    textDimmed: '#3b4261',
    textMuted: '#565f89',
    textToned: '#737aa2',
    text: '#a9b1d6',
    textHighlighted: '#c0caf5',
    textInverted: '#24283b',
    primary: '#7aa2f7',
    secondary: '#bb9af7',
    success: '#9ece6a',
    warning: '#e0af68',
    error: '#f7768e',
    info: '#7dcfff',
    tokens: {
        default: { color: '#c0caf5' },
        identifier: { color: '#c0caf5' },
        keyword: { color: '#bb9af7' },
        delimiter: { color: '#89ddff' },
        type: { color: '#2ac3de', style: 'bold' },
        number: { color: '#ff9e64' },
        numberHex: { color: '#ff9e64' },
        string: { color: '#9ece6a' },
        stringEscape: { color: '#bb9af7' },
        comment: { color: '#565f89', style: 'italic' },
        commentDoc: { color: '#737aa2', style: 'italic' },
        regexp: { color: '#b4f9f8' },
        bracketColor1: '#7aa2f7',
        bracketColor2: '#e0af68',
        bracketColor3: '#bb9af7',
        bracketColorUnexpected: '#f7768e',
    }
}

export default tokyoNight