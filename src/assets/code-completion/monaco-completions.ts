import * as monaco from 'monaco-editor'

// @ts-ignore
function provideSpriteSuggestions(range) {
	// returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
	// here you could do a server side lookup
	return [
		{
			label: 'TESTINGTESTING',
			kind: monaco.languages.CompletionItemKind.Property,
			documentation: "The Lodash library exported as Node.js modules.",
			insertText: 'TEST',
			range: range,
		},
		{
			label: 'y',
			kind: monaco.languages.CompletionItemKind.Property,
			documentation: "Fast, unopinionated, minimalist web framework",
			insertText: 'y',
			range: range,
		},
		{
			label: '"mkdirp"',
			kind: monaco.languages.CompletionItemKind.Function,
			documentation: "Recursively mkdir, like <code>mkdir -p</code>",
			insertText: '"mkdirp": "*"',
			range: range,
		},
		{
			label: '"my-third-party-library"',
			kind: monaco.languages.CompletionItemKind.Function,
			documentation: "Describe your library here",
			insertText: '"${1:my-third-party-library}": "${2:1.2.3}"',
			insertTextRules:
				monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
			range: range,
		},
	];
}

monaco.languages.registerCompletionItemProvider('javascript', {
	provideCompletionItems: function (model, position) {
		// find out if we are completing a property in the 'dependencies' object.
		var textUntilPosition = model.getValueInRange({
			startLineNumber: 1,
			startColumn: 1,
			endLineNumber: position.lineNumber,
			endColumn: position.column,
		});
		var match = textUntilPosition.match(
			// /"dependencies"\s*:\s*\{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*([^"]*)?$/
            /new\s*Sprite\s*\(\s*\{\s*$/ // add groups for arbitrary number of previous args
		);
		if (!match) {
            console.log('no match')
			return { suggestions: [] };
		}
		var word = model.getWordUntilPosition(position);
		var range = {
			startLineNumber: position.lineNumber,
			endLineNumber: position.lineNumber,
			startColumn: word.startColumn,
			endColumn: word.endColumn,
		};
        console.log('providing suggestions')
		return {
			suggestions: provideSpriteSuggestions(range),
		};
	},
});

// Monaco autocompletion
// monaco.languages.registerCompletionItemProvider('javascript', {
//   provideCompletionItems() {
//     return {
//       suggestions: [
//         {
//           label: 'repeat',
//           kind: monaco.languages.CompletionItemKind.Function,
//           insertText: 'repeat(delta => \{\n\t${1:...}\n\})',
//           insertTextRules:
//             monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
//         }
//       ]
//     }
//   }
// })