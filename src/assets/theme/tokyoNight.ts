import type { ThemePalette } from "./themes";

const tokyoNight: ThemePalette = {
    // Authentic Tokyo Night (Storm variant) palette.
    id: 'tokyo-night-storm',
    label: 'Tokyo Night Storm',
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

export default tokyoNight