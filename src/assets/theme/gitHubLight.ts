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
        default: { color: '#1f2328' },
        identifier: { color: '#1f2328' },
        keyword: { color: '#cf222e' },
        delimiter: { color: '#1f2328' },
        type: { color: '#953800', style: 'bold' },
        number: { color: '#0550ae' },
        numberHex: { color: '#0550ae' },
        string: { color: '#0a3069' },
        stringEscape: { color: '#0550ae' },
        comment: { color: '#6e7781', style: 'italic' },
        commentDoc: { color: '#6e7781', style: 'italic' },
        regexp: { color: '#0a3069' },
        bracketColor1: '#0550ae',
        bracketColor2: '#953800',
        bracketColor3: '#8250df',
        bracketColorUnexpected: '#cf222e',
    }
}

export default gitHubLight