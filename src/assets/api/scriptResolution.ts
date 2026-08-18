import * as ts from 'typescript'
import { DEFAULT_SCRIPT_FILE_TYPE, splitFileName } from '@/assets/utils/fileTypes'

// Shared between moduleRunner.ts (runtime import resolution) and
// CodeEditor.vue (Monaco model URIs), so the IDE and the actual game
// execution always agree on what './helper' resolves to.

export function resolveSpecifierToName(specifier: string): string {
    let name = specifier.trim()
    if (name.startsWith('./')) name = name.slice(2)
    else if (name.startsWith('/')) name = name.slice(1)
    if (!splitFileName(name).extension) name += '.' + DEFAULT_SCRIPT_FILE_TYPE.extension
    return name
}

// Collects the raw specifier text of every top-level `import` statement in
// a script, e.g. `import { x } from './helper.js'` -> './helper.js'.
export function listImportSpecifiers(source: string, label = 'script.js'): string[] {
    const sourceFile = ts.createSourceFile(label, source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.JS)
    const specifiers: string[] = []

    for (const statement of sourceFile.statements) {
        if (!ts.isImportDeclaration(statement)) continue
        if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue
        specifiers.push(statement.moduleSpecifier.text)
    }

    return specifiers
}
