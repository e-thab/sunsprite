import type { ThemePalette } from "./themes";

const gitHubLight: ThemePalette = {
    // Modeled on GitHub's light UI palette.
    id: 'github-light',
    label: 'GitHub Light',
    isLight: true,
    bg: '#ffffff',
    bgMuted: '#f6f8fa',
    bgElevated: '#eaeef2',
    bgAccented: '#d0d7de',
    bgInverted: '#10161c',
    border: '#d0d7de',
    textDimmed: '#d0d7de',
    textMuted: '#656d76',
    textToned: '#6e7781',
    text: '#1f2328',
    textHighlighted: '#10161c',
    textInverted: '#ffffff',
    primary: '#0969da',
    secondary: '#8250df',
    success: '#1a7f37',
    warning: '#9a6700',
    error: '#d1242f',
    info: '#1b7c83',
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

export default gitHubLight