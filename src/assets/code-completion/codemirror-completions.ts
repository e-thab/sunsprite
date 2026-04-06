
import { CompletionContext, snippetCompletion } from "@codemirror/autocomplete"
import { hoverTooltip } from "@codemirror/view"

export function completions(context: CompletionContext) {
    let word = context.matchBefore(/\w*/)
    if (word?.from == word?.to && !context.explicit)
        return null
    return {
        from: word?.from,
        options: [
            // https://codemirror.net/docs/ref/#autocomplete.Completion
            //
            // {label: "match", type: "keyword"},
            // {label: "hello", type: "variable", info: "(World)"},
            // {label: "magic", type: "text", apply: "⠁⭒*.✩.*⭒⠁", detail: "macro"},
            // {label: "pi", type: "constant", apply: "π", detail: "macro"},
            snippetCompletion(`PI`, {
                label: 'PI',
                type: 'constant',
                detail: '3.141592653589793',
                info: 'π',
                boost: 2
            }),
            snippetCompletion(`forever(delta => {\n\t#{1:/* ... */}\n})`, {
                label: 'forever',
                type: 'function',
                detail: '(delta => {...})',
                info: 'Runs once each frame.\ndelta: The number of seconds since last frame.',
                boost: 2
            }),
            snippetCompletion(`repeat(#{1:times}, i => {\n\t#{2:/* ... */}\n})`, {
                label: 'repeat',
                type: 'function',
                detail: '(i => {...})',
                info: 'Runs a given number of times.\ni: The number of times this repeat has run so far.',
                boost: 2
            }),
            snippetCompletion(`every(#{1:seconds}, () => {\n\t#{2:/* ... */}\n})`, {
                label: 'every',
                type: 'function',
                detail: '(() => {...})',
                info: 'Runs once every x seconds.',
                boost: 2
            }),
            snippetCompletion(`after(#{1:seconds}, () => {\n\t#{2:/* ... */}\n})`, {
                label: 'after',
                type: 'function',
                detail: '(() => {...})',
                info: 'Runs once after a delay of x seconds.',
                boost: 2
            }),
            snippetCompletion(`keyPressed(#{1:key})`, {
                label: 'keyPressed',
                type: 'function',
                detail: '-> bool',
                info: 'Returns a boolean representing if the given key is currently pressed.',
                boost: 2
            }),
            snippetCompletion(`keyJustPressed(#{1:key})`, {
                label: 'keyJustPressed',
                type: 'function',
                detail: '-> bool',
                info: 'Returns a boolean representing if the given key was just pressed last frame. Use this to handle single-press behaviors.',
                boost: 2
            }),
            snippetCompletion(`deg2rad(#{1:degrees})`, {
                label: 'deg2rad',
                type: 'function',
                detail: '-> number',
                info: 'Converts angles from degrees to radians',
                boost: 2
            }),
            snippetCompletion(`rad2deg(#{1:radians})`, {
                label: 'rad2deg',
                type: 'function',
                detail: '-> number',
                info: 'Converts angles from radians to degrees',
                boost: 2
            }),
        ],
        validFor: /^\w*$/
    }
}

export const wordHover = hoverTooltip((view, pos, side) => {
    let {from, to, text} = view.state.doc.lineAt(pos)

    /* Check 1: Look for image filenames as strings */
    /* Come back to this */
    // let start = pos, end = pos
    // //@ts-ignore
    // while (start > from && /['"]/.test(text[start - from - 1])) start--
    // console.log(`start: ${start}`)
    // //@ts-ignore
    // while (end < to && /(['"])[^'"]+\.(png|jpg|svg)\1/.test(text.slice(start, end))) end++
    // console.log(`end: ${end}`)
    // if (!(start == pos && side < 0 || end == pos && side > 0)) {
    //     return {
    //         pos: start,
    //         end,
    //         above: true,
    //         create(view) {
    //             console.log('found string')
    //             let dom = document.createElement("div")
    //             const imageSource = text.slice(start - from, end - from)

    //             dom.innerHTML = (() => {
    //                 return `<img src=${imageSource}></img>`
    //             })()

    //             return {dom}
    //         }
    //     }
    // }
    // console.log(`non-string tested: ${text.slice(start - from, end - from)}`)

    /* Check 2: Match any single words */
    let start = pos, end = pos
    //@ts-ignore
    while (start > from && /\w/.test(text[start - from - 1])) start--
    //@ts-ignore
    while (end < to && /\w/.test(text[end - from])) end++
    if (start == pos && side < 0 || end == pos && side > 0)
        return null
    return {
        pos: start,
        end,
        above: true,
        create(view) {
            let dom = document.createElement("div")
            const hoveredWord = text.slice(start - from, end - from)

            dom.innerHTML = (() => {
                switch (hoveredWord) {
                    case 'Sprite':
                        return  `
                        <span style='color: Aquamarine; font-size: 20px;'>Sprite</span>
                        <span style='color: Silver; font-size: 14'><i>class</i></span> <br>

                        <span style='font-size: 18px;'>Properties</span> <br>
                            <span style='color: Silver;'><i>string</i></span>
                            <span style='color: Aquamarine; font-size: 16px;'>src</span>:
                            The path to the image this sprite should display <br>

                            <span style='color: Silver;'><i>number</i></span>
                            <span style='color: Aquamarine; font-size: 16px;'>x</span>:
                            The sprite's center x position <br>

                            <span style='color: Silver;'><i>number</i></span>
                            <span style='color: Aquamarine; font-size: 16px;'>y</span>:
                            The sprite's center y position <br>

                            <!-- pivotX / pivotY -->

                            <span style='color: Silver;'><i>number</i></span>
                            <span style='color: Aquamarine; font-size: 16px;'>rotation</span>:
                            The rotation of the sprite in degrees <br>

                            <span style='color: Silver;'><i>number</i></span>
                            <span style='color: Aquamarine; font-size: 16px;'>radians</span>:
                            The rotation of the sprite in <a href='https://www.mathsisfun.com/geometry/radians.html' target='_blank'>radians</a> <br>

                            <span style='color: Silver;'><i>function</i></span>
                            <span style='color: Aquamarine; font-size: 16px;'>onClick</span>:
                            The function to run when the sprite is clicked <br>

                        <span style='font-size: 18px;'>Methods</span> <br>
                            <span style='color: Silver;'><i>void</i></span>
                            <span style='color: Aquamarine; font-size: 16px;'>show()</span>:
                            Makes the sprite visible <br>

                            <span style='color: Silver;'><i>void</i></span>
                            <span style='color: Aquamarine; font-size: 16px;'>hide()</span>:
                            Makes the sprite invisible <br>

                            <span style='color: Silver;'><i>void</i></span>
                            <span style='color: Aquamarine; font-size: 16px;'>rotate(angle, unit='degrees')</span>:
                            Set the rotation of the sprite to {angle} using {unit}, which should be either 'degrees' or 'radians' <br>
                    `
                    
                    default:
                        return hoveredWord
                }
            })()

            return {dom}
        }
    }
})