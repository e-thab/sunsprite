
import { CompletionContext, snippetCompletion } from "@codemirror/autocomplete"

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
                // info: '3.14',
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