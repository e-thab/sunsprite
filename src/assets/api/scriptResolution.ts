import * as ts from 'typescript'
import { DEFAULT_SCRIPT_FILE_TYPE, SCRIPT_FILE_TYPES, scriptTypeForFile, splitFileName } from '@/assets/utils/fileTypes'

// Shared between moduleRunner.ts (runtime import resolution) and
// CodeEditor.vue (Monaco model URIs), so the IDE and the actual game
// execution always agree on what './helper' resolves to.
//
// Deliberately free of any store access: this module is imported by
// moduleRunner.ts, which runs inside the sandbox iframe where no pinia store
// exists. Everything here is derived from the specifier and the name of the
// script doing the importing — never from the project's language setting.

/** Which TS parser mode a file's own name calls for. */
export function scriptKindFor(fileName: string): ts.ScriptKind {
    return scriptTypeForFile(fileName).id === 'typescript' ? ts.ScriptKind.TS : ts.ScriptKind.JS
}

/**
 * Every name an extensionless specifier could mean, best candidate first —
 * the importer's own language leads, since `./helper` written inside a .ts
 * file almost always means the .ts one. Callers probe these in order against
 * whatever they have (the file store, the model map) and take the first hit.
 *
 * A specifier that already carries an extension is unambiguous and comes back
 * as the single candidate it names.
 */
export function resolveSpecifierCandidates(specifier: string, importerName?: string): string[] {
    let name = specifier.trim()
    if (name.startsWith('./')) name = name.slice(2)
    else if (name.startsWith('/')) name = name.slice(1)

    if (splitFileName(name).extension) return [name]

    const preferred = importerName
        ? scriptTypeForFile(importerName).extension
        : DEFAULT_SCRIPT_FILE_TYPE.extension
    const extensions = [
        preferred,
        ...SCRIPT_FILE_TYPES.map((type) => type.extension).filter((extension) => extension !== preferred),
    ]
    return extensions.map((extension) => `${name}.${extension}`)
}

/**
 * The single name a specifier resolves to when there's nothing to probe
 * against — the best candidate, i.e. what it means in a project that doesn't
 * happen to contain the same base name under two extensions.
 */
export function resolveSpecifierToName(specifier: string, importerName?: string): string {
    return resolveSpecifierCandidates(specifier, importerName)[0]!
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
