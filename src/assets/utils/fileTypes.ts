// Central place for recognizing a file's type from its name/content, and for
// the base/extension split every create/upload/rename flow needs so the
// extension itself never becomes user-editable text (it's always the
// registry's canonical one for the recognized type, not whatever — if
// anything — the source file or typed name happened to carry).
//
// A script's type is recognized from its own extension, never from a
// project-wide mode: each file is highlighted, type-checked, and compiled as
// whatever it is. Nothing about the project's settings can change what an
// existing file means.
//
// What a project *does* choose is its **family** — the runtime its scripts run
// on. That's the thing that genuinely can't mix. JavaScript and TypeScript are
// one family: .ts has no runtime of its own, it compiles to JavaScript and runs
// as JavaScript, through the same module system, the same API declarations, and
// the same editor language service. So a JavaScript project supports both
// extensions unconditionally, and they can import each other freely — which is
// most of the point of having both.
//
// A future family (Python) would share none of that: its own runtime in the
// sandbox, its own API bindings, no imports across the boundary. Hence the
// rule: a project picks one family, and every script type *within* that family
// is available to it. There's deliberately no switch for enabling TypeScript —
// there was never a capability to enable, only a menu to filter.
//
// So: scriptTypeForFile() for a file that exists, familyScriptTypes() for what
// a project may create. Reaching for DEFAULT_SCRIPT_FILE_TYPE to mean "the
// project's type" is the one thing that's wrong — it's only the fallback.

/** Stable key for one script *type* — one extension's worth of language. */
export type ScriptTypeId = 'javascript' | 'typescript'

/**
 * Stable key for a *family* — a runtime, and the set of script types that run
 * on it. Persisted (see projectSettingsStore's scriptFamily), so it must stay
 * put even if the label changes; `label` is display text only.
 */
export type ScriptFamilyId = 'javascript'

export interface ScriptFileType {
	id: ScriptTypeId
	/** The runtime this type runs on. Types sharing one can import each other. */
	family: ScriptFamilyId
	extension: string
	label: string
	icon: string
	monacoLanguage: string
}

export interface ScriptFamily {
	id: ScriptFamilyId
	label: string
}

/**
 * The families a project can be written in — exactly what the Language setting
 * offers. "JavaScript" names the whole family, TypeScript included: that's how
 * the ecosystem itself refers to it (Deno, Bun, Vite all say JavaScript and
 * take .ts transparently), and a .ts file really is a JavaScript file with
 * types. Nothing here needs to read "JavaScript + TypeScript".
 */
export const SCRIPT_FAMILIES: ScriptFamily[] = [
	{ id: 'javascript', label: 'JavaScript' },
]

// Original js icon that has no ts match: 'ri:javascript-fill'
// catpuccin outline-block style:
// catppuccin:javascript
// catppuccin:typescript

// Order within a family matters: the first entry is what a script gets when
// nothing picked a type explicitly (seeding a new project's main.*), and it
// leads the extension order an extensionless import is probed against.
export const SCRIPT_FILE_TYPES: ScriptFileType[] = [
	{ id: 'javascript', family: 'javascript', extension: 'js', label: 'JavaScript', icon: 'vscode-icons:file-type-js', monacoLanguage: 'javascript' },
	{ id: 'typescript', family: 'javascript', extension: 'ts', label: 'TypeScript', icon: 'vscode-icons:file-type-typescript', monacoLanguage: 'typescript' },
]

// The fallback for anything unrecognized, and what a project that has never
// touched the setting creates scripts in. Still deliberately the first entry:
// every project predating the setting is written in JavaScript, so this is
// what "unset" has to keep meaning.
export const DEFAULT_SCRIPT_FILE_TYPE: ScriptFileType = SCRIPT_FILE_TYPES[0]!

export function scriptFileType(extension: string): ScriptFileType {
	return SCRIPT_FILE_TYPES.find((t) => t.extension === extension.toLowerCase()) ?? DEFAULT_SCRIPT_FILE_TYPE
}

/** The family a stored id names, or the default if this build doesn't have it. */
export function scriptFamilyById(id: string): ScriptFamily {
	return SCRIPT_FAMILIES.find((family) => family.id === id) ?? SCRIPT_FAMILIES[0]!
}

/**
 * Every script type a family can create, best-default first — what the project
 * may offer when a script is made. Falls back rather than returning nothing: a
 * family id written by a newer client should degrade to the default family's
 * types, not leave the project unable to create a script at all.
 */
export function familyScriptTypes(familyId: string): ScriptFileType[] {
	const types = SCRIPT_FILE_TYPES.filter((type) => type.family === familyId)
	return types.length ? types : SCRIPT_FILE_TYPES.filter((type) => type.family === SCRIPT_FAMILIES[0]!.id)
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

/** What the game runtime loads an uploaded file as — a texture or a sound. */
export type AssetKind = 'image' | 'audio'

export interface UploadFileType {
	kind: AssetKind
	extension: string
	/** The one content type stored for this format — see ALLOWED_CONTENT_TYPES in uploadLimits.ts. */
	contentType: string
	/**
	 * Other content types browsers report for the same format — which one you
	 * get depends on the browser and, on Windows, the registry (a .wav can
	 * arrive as audio/wav, audio/x-wav, or audio/wave). Mapped onto
	 * contentType before upload, so only the canonical form is ever stored.
	 */
	aliases?: string[]
	label: string
	icon: string
}

const UPLOAD_FILE_TYPES: UploadFileType[] = [
	{ kind: 'image', extension: 'png', contentType: 'image/png', label: 'PNG', icon: 'catppuccin:image' },
	{ kind: 'image', extension: 'jpg', contentType: 'image/jpeg', label: 'JPG', icon: 'catppuccin:image' },
	{ kind: 'image', extension: 'svg', contentType: 'image/svg+xml', label: 'SVG', icon: 'catppuccin:svg' },
	{ kind: 'image', extension: 'webp', contentType: 'image/webp', label: 'WebP', icon: 'catppuccin:image' },
	{ kind: 'audio', extension: 'mp3', contentType: 'audio/mpeg', aliases: ['audio/mp3'], label: 'MP3', icon: 'catppuccin:audio' },
	{ kind: 'audio', extension: 'ogg', contentType: 'audio/ogg', aliases: ['application/ogg', 'video/ogg'], label: 'Ogg', icon: 'catppuccin:audio' },
	{ kind: 'audio', extension: 'wav', contentType: 'audio/wav', aliases: ['audio/x-wav', 'audio/wave', 'audio/vnd.wave'], label: 'WAV', icon: 'catppuccin:audio' },
	{ kind: 'audio', extension: 'm4a', contentType: 'audio/mp4', aliases: ['audio/x-m4a', 'audio/m4a'], label: 'M4A', icon: 'catppuccin:audio' },
]

// Extensions as well as content types: a file picker's accept list matches on
// either, and some formats (.ogg especially) come through with a content type
// the browser doesn't consider audio at all.
export const UPLOAD_ACCEPT_ATTR = UPLOAD_FILE_TYPES
	.flatMap((t) => [`.${t.extension}`, t.contentType, ...(t.aliases ?? [])])
	.join(',')

/** Human list of every uploadable format, for "only X, Y, and Z are supported" messages. */
export const UPLOAD_FORMAT_LABELS = UPLOAD_FILE_TYPES.map((t) => t.label)

export function uploadFileTypeForContentType(contentType: string): UploadFileType | undefined {
	return UPLOAD_FILE_TYPES.find((t) => t.contentType === contentType || t.aliases?.includes(contentType))
}

export function uploadFileTypeForExtension(extension: string): UploadFileType | undefined {
	return UPLOAD_FILE_TYPES.find((t) => t.extension === extension.toLowerCase())
}

/**
 * The format an uploaded file is recognized as, from its reported content type
 * first and its extension only when the content type says nothing useful —
 * empty, or generic, which is what Windows hands over for any extension its
 * registry doesn't map (.ogg and .m4a on a fresh install, typically).
 */
export function uploadFileTypeFor(file: File): UploadFileType | undefined {
	return uploadFileTypeForContentType(file.type)
		?? (isGenericContentType(file.type) ? uploadFileTypeForExtension(splitFileName(file.name).extension) : undefined)
}

function isGenericContentType(contentType: string): boolean {
	return contentType === '' || contentType === 'application/octet-stream'
}

/** Which kind of asset a stored file name is, going by its extension. */
export function assetKindForName(name: string): AssetKind | undefined {
	return uploadFileTypeForExtension(splitFileName(name).extension)?.kind
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
// real content type where it has a useful one (see uploadFileTypeFor), and
// that recognized type's canonical extension is what gets appended to it —
// "song.MP3" and "song.mpeg" both become "song.mp3".
export function uploadDisplayName(file: File): string {
	const { base, extension } = splitFileName(file.name)
	const canonicalExtension = uploadFileTypeFor(file)?.extension ?? extension
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

// What a row dragged out of the file tree carries its name under — set in
// FileTree.vue, read by CodeEditor.vue's drop handler. Deliberately not
// text/plain: Monaco's own text drop would claim that and insert it with a
// literal "$0" appended (see CodeEditor.vue's onEditorDrop for why).
export const FILE_TREE_DRAG_MIME = 'application/x-sunsprite-file-name'
