import type { ThemePalette } from "./themes";
import { random as randomLib } from "../api/utility";

const randomColor = randomLib.color

const random: ThemePalette = {
    // Authentic Dracula (draculatheme.com) palette.
    id: 'random',
    label: 'Random',
    isLight: false,
    bg: randomColor(),
    bgMuted: randomColor(),
    bgElevated: randomColor(),
    bgAccented: randomColor(),
    bgInverted: randomColor(),
    border: randomColor(),
    textDimmed: randomColor(),
    textMuted: randomColor(),
    textToned: randomColor(),
    text: randomColor(),
    textHighlighted: randomColor(),
    textInverted: randomColor(),
    primary: randomColor(),
    secondary: randomColor(),
    success: randomColor(),
    warning: randomColor(),
    error: randomColor(),
    info: randomColor(),
    tokens: {
        default: { color: randomColor() },
        identifier: { color: randomColor() },
        keyword: { color: randomColor() },
        delimiter: { color: randomColor() },
        type: { color: randomColor(), style: 'bold' },
        number: { color: randomColor() },
        numberHex: { color: randomColor() },
        string: { color: randomColor() },
        stringEscape: { color: randomColor() },
        comment: { color: randomColor(), style: 'italic' },
        commentDoc: { color: randomColor() },
        regexp: { color: randomColor() },
        bracketColor1: randomColor(),
        bracketColor2: randomColor(),
        bracketColor3: randomColor(),
        bracketColorUnexpected: randomColor(),
    }
}

export default random