import * as ts from 'typescript'
import { SCRIPT_FILE_TYPES, scriptTypeForFile, splitFileName } from '@/assets/utils/fileTypes'

// Shared between moduleRunner.ts (runtime import resolution) and
// CodeEditor.vue (Monaco model URIs), so the IDE and the actual game
// execution always agree on what './helper' resolves to.
//
// Deliberately free of any store access: this module is imported by
// moduleRunner.ts, which runs inside the sandbox iframe where no pinia store
// exists. Everything here is derived from the specifier alone.

/** Which TS parser mode a file's own name calls for. */
export function scriptKindFor(fileName: string): ts.ScriptKind {
    return scriptTypeForFile(fileName).id === 'typescript' ? ts.ScriptKind.TS : ts.ScriptKind.JS
}

/**
 * Every name an extensionless specifier could mean — one per script extension.
 * Callers probe them in order against whatever they have (the file store, the
 * model map) and take the first that exists.
 *
 * Order is the registry's and carries no meaning: script names are unique by
 * *base* name across extensions (FileTree's conflictingScript enforces it), so
 * at most one candidate can exist and every order finds the same file. An
 * earlier version ranked them by the importing script's own language, which
 * mattered only while helper.js and helper.ts could sit side by side.
 *
 * A specifier that already carries an extension is unambiguous and comes back
 * as the single candidate it names.
 */
export function resolveSpecifierCandidates(specifier: string): string[] {
    let name = specifier.trim()
    if (name.startsWith('./')) name = name.slice(2)
    else if (name.startsWith('/')) name = name.slice(1)

    if (splitFileName(name).extension) return [name]

    return SCRIPT_FILE_TYPES.map((type) => `${name}.${type.extension}`)
}

// Collects the raw specifier text of every top-level `import` statement in
// a script, e.g. `import { x } from './helper.js'` -> './helper.js'.
// Type-only imports are deliberately included: they still name a real file
// whose model the editor needs in order to resolve the type at all. The
// runtime never sees them — TypeScript elides them before moduleRunner's
// rewriting ever runs (see transpile.ts).
export function listImportSpecifiers(source: string, label = 'script.js'): string[] {
    const sourceFile = ts.createSourceFile(label, source, ts.ScriptTarget.ES2020, true, scriptKindFor(label))
    const specifiers: string[] = []

    for (const statement of sourceFile.statements) {
        if (!ts.isImportDeclaration(statement)) continue
        if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue
        specifiers.push(statement.moduleSpecifier.text)
    }

    return specifiers
}
