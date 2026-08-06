import type { ThemePalette } from "./themes";

// Currently disabled

const gruvbox: ThemePalette = {
    // Gruvbox palette via https://github.com/morhetz/gruvbox
    id: 'gruvbox',
    label: 'Gruvbox',
    isLight: false,
    bg: '#1d2021',
    bgMuted: '#282828',
    bgElevated: '#3c3836',
    bgAccented: '#504945',
    bgInverted: '#a89984',
    border: '#32302f',
    textDimmed: '#a89984',
    textMuted: '#bdae93',
    textToned: '#ebdbb2',
    text: '#fbf1c7',
    textHighlighted: '#ffffff',
    textInverted: '#1d2021',
    primary: '#8ec07c',
    secondary: '#d3869b',
    success: '#b8bb26',
    warning: '#fabd2f',
    error: '#fb4934',
    info: '#83a598',
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

export default gruvbox