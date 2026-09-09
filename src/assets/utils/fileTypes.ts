// Central place for recognizing a file's type from its name/content, and for
// the base/extension split every create/upload/rename flow needs so the
// extension itself never becomes user-editable text (it's always the
// registry's canonical one for the recognized type, not whatever — if
// anything — the source file or typed name happened to carry).
//
// A script's language is recognized from its own extension, never from a
// project-wide mode: a project can hold both .js and .ts files, and each one
// is highlighted, type-checked, and compiled as what it is. The project's
// settings only decide which types are *offered* when a script is created —
// that's the whole of their reach, which is what keeps changing them from
// being a migration. Nothing already in the project changes name or meaning.
//
// Two kinds of entry live in the registry below. A *base language* is one a
// project is written in and picks in its settings. A *companion* isn't
// separately selectable — it's an opt-in alongside its base, which is exactly
// what TypeScript is to JavaScript: same runtime, same API declarations, same
// editor language service, just an additional extension a project can choose
// to allow. A future base language (Python, say) would be another entry with
// no companionTo, and would get no such toggle unless it grew one.
//
// So: scriptTypeForFile() for a file that exists, scriptTypeById() for a
// stored id. Reaching for DEFAULT_SCRIPT_FILE_TYPE to mean "the project's
// language" is the one thing that's wrong — it's only the fallback.

/**
 * Stable key for a script language. This is what gets persisted, so it must
 * stay put even if the label changes — `label` is display text only.
 */
export type ScriptLanguageId = 'javascript' | 'typescript'

export interface ScriptFileType {
	id: ScriptLanguageId
	extension: string
	label: string
	icon: string
	monacoLanguage: string
	/**
	 * Set when this is an opt-in companion to another language rather than one
	 * a project is written in. A companion never appears in the Language
	 * setting; it's reached by allowing it alongside its base.
	 */
	companionTo?: ScriptLanguageId
}

export const SCRIPT_FILE_TYPES: ScriptFileType[] = [
	{ id: 'javascript', extension: 'js', label: 'JavaScript', icon: 'ri:javascript-fill', monacoLanguage: 'javascript' },
	{ id: 'typescript', extension: 'ts', label: 'TypeScript', icon: 'catppuccin:typescript', monacoLanguage: 'typescript', companionTo: 'javascript' },
]

// The fallback for anything unrecognized, and what a project that has never
// touched the setting creates scripts in. Still deliberately the first entry:
// every project predating the setting is written in JavaScript, so this is
// what "unset" has to keep meaning.
export const DEFAULT_SCRIPT_FILE_TYPE: ScriptFileType = SCRIPT_FILE_TYPES[0]!

export function scriptFileType(extension: string): ScriptFileType {
	return SCRIPT_FILE_TYPES.find((t) => t.extension === extension.toLowerCase()) ?? DEFAULT_SCRIPT_FILE_TYPE
}

/**
 * The languages a project can actually be written in — what the Language
 * setting offers. Companions are deliberately absent: TypeScript isn't a
 * choice a project makes *instead* of JavaScript, it's one it allows
 * *alongside* it (see companionScriptType).
 */
export const SELECTABLE_SCRIPT_LANGUAGES: ScriptFileType[] = SCRIPT_FILE_TYPES.filter((type) => !type.companionTo)

/**
 * The opt-in companion to a base language, if it has one — TypeScript for
 * JavaScript, nothing for anything else. What decides whether a project sees
 * an "Allow ..." toggle at all, and what that toggle is named.
 */
export function companionScriptType(baseId: string): ScriptFileType | undefined {
	return SCRIPT_FILE_TYPES.find((type) => type.companionTo === baseId)
}

/**
 * The type a stored language id names — for reading the project setting back
 * into a concrete extension and Monaco language. Falls back rather than
 * throwing: an id written by a newer client (a language this build doesn't
 * have) should degrade to JavaScript, not strand the project unopenable.
 */
export function scriptTypeById(id: string): ScriptFileType {
	return SCRIPT_FILE_TYPES.find((t) => t.id === id) ?? DEFAULT_SCRIPT_FILE_TYPE
}

/**
 * The type a file *is*, from its own name — the lookup every consumer holding
 * an existing file should use: which Monaco language its model gets, which
 * ScriptKind the TS parser reads it as, which extension one of its own
 * extensionless imports resolves to first. Never consults the project setting.
 */
export function scriptTypeForFile(fileName: string): ScriptFileType {
	return scriptFileType(splitFileName(fileName).extension)
}

// The entry script every project has. Its *base* name is the fixed part —
// the extension follows whichever language it was created in — so anything
// asking "is this the main script?" has to test the base rather than match a
// literal "main.js", which stopped being the only possible spelling once
// TypeScript projects became creatable.
export const MAIN_SCRIPT_BASE = 'main'

export function isMainScript(fileName: string): boolean {
	return splitFileName(fileName).base === MAIN_SCRIPT_BASE
}

export interface ImageFileType {
	extension: string
	contentType: string
	label: string
	icon: string
}

const IMAGE_FILE_TYPES: ImageFileType[] = [
	{ extension: 'png', contentType: 'image/png', label: 'PNG', icon: 'catppuccin:image' },
	{ extension: 'jpg', contentType: 'image/jpeg', label: 'JPG', icon: 'catppuccin:image' },
	{ extension: 'svg', contentType: 'image/svg+xml', label: 'SVG', icon: 'catppuccin:svg' },
	{ extension: 'webp', contentType: 'image/webp', label: 'WebP', icon: 'catppuccin:image' },
]

export const ALLOWED_IMAGE_CONTENT_TYPES = new Set(IMAGE_FILE_TYPES.map((t) => t.contentType))
export const IMAGE_ACCEPT_ATTR = IMAGE_FILE_TYPES.map((t) => t.contentType).join(',')

export function imageFileTypeForContentType(contentType: string): ImageFileType | undefined {
	return IMAGE_FILE_TYPES.find((t) => t.contentType === contentType)
}

export function imageFileTypeForExtension(extension: string): ImageFileType | undefined {
	return IMAGE_FILE_TYPES.find((t) => t.extension === extension.toLowerCase())
}

// "photo.png" -> { base: "photo", extension: "png" }. No dot (or nothing
// before the last one) means no extension at all, not an error — callers
// decide what that means for them. Last-dot rule, matching the import-
// specifier parsing in scriptResolution.ts.
export function splitFileName(name: string): { base: string; extension: string } {
	const match = /^(.+)\.([a-zA-Z0-9]+)$/.exec(name)
	if (!match) return { base: name, extension: '' }
	return { base: match[1]!, extension: match[2]! }
}

export function joinFileName(base: string, extension: string): string {
	return extension ? `${base}.${extension}` : base
}

// A generous cap, not a technical constraint — keeps tree rows, the editor
// header, and anywhere else a name renders from being able to blow past
// reasonable UI bounds. Applies to the *base* name only — the extension
// (".js", ".png", ...) is never counted against it, for scripts/text
// files/images alike. Folders have no extension, so their whole name is
// the base as far as this is concerned.
export const MAX_FILE_NAME_LENGTH = 40

// Callers pass just the base — split off the extension first (splitFileName)
// if what you have is a full stored name.
export function isFileNameTooLong(base: string): boolean {
	return base.length > MAX_FILE_NAME_LENGTH
}

// Mirrors the text_files table's own check (char_length(content) <= 1000000)
// — scripts has no equivalent database constraint at all, so for scripts
// this is the *only* backstop, not just a friendlier duplicate of one. A
// plain character count, not exact byte parity with Postgres's char_length
// (which would need real Unicode code-point counting to match precisely) —
// this exists to catch a many-hundred-MB paste before it ever leaves the
// browser, not to be byte-precise about edge cases right at the boundary.
// Prompted by a real incident: a 200MB text file save with no guard in
// front of it correlated with the project's Supabase instance going
// unhealthy shortly after.
export const MAX_FILE_CONTENT_LENGTH = 1_000_000

export function isFileContentTooLong(content: string): boolean {
	return content.length > MAX_FILE_CONTENT_LENGTH
}

// The name an upload is stored under: type is recognized from the file's
// real content type (not trusted from whatever extension, if any, the source
// file's own name happened to have), and that recognized type's canonical
// extension is what gets appended to it.
export function imageDisplayName(file: File): string {
	const { base, extension } = splitFileName(file.name)
	const canonicalExtension = imageFileTypeForContentType(file.type)?.extension ?? extension
	return joinFileName(base, canonicalExtension)
}

export interface TextFileType {
	extension: string
	label: string
	icon: string
}

// The only kind of text file the "New text file" action creates today —
// always blank, always .txt. Kept as its own type/constant (mirroring
// DEFAULT_SCRIPT_FILE_TYPE) rather than a hardcoded literal at the one call
// site, so a future "pick a type" option would grow this into a small
// TEXT_FILE_TYPES registry the same way scripts are set up for languages.
export const DEFAULT_TEXT_FILE_TYPE: TextFileType = { extension: 'txt', label: 'Text File', icon: 'tabler:file-text-filled' }

// Every text file opens under this Monaco language, regardless of its own
// extension — deliberately not per-extension detection (no JSON/Markdown
// highlighting): "text file" as a category always means no language worker,
// no diagnostics, no completions, same as opening a .txt in VS Code.
export const TEXT_MONACO_LANGUAGE = 'plaintext'
