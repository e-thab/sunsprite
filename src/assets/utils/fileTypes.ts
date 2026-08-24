// Central place for recognizing a file's type from its name/content, and for
// the base/extension split every create/upload/rename flow needs so the
// extension itself never becomes user-editable text (it's always the
// registry's canonical one for the recognized type, not whatever — if
// anything — the source file or typed name happened to carry).
//
// Scripts only ever come in one flavor today (JavaScript) — DEFAULT_SCRIPT_FILE_TYPE
// is what every project's scripts are created with. There's no per-project
// language mode yet (no such field exists on `projects`); once one does, the
// call sites reading DEFAULT_SCRIPT_FILE_TYPE directly become the ones that
// look it up by that field instead, against a SCRIPT_FILE_TYPES with more
// than the one entry below.

export interface ScriptFileType {
	extension: string
	label: string
	icon: string
	monacoLanguage: string
}

const SCRIPT_FILE_TYPES: ScriptFileType[] = [
	{ extension: 'js', label: 'JavaScript', icon: 'ri:javascript-fill', monacoLanguage: 'javascript' },
]

export const DEFAULT_SCRIPT_FILE_TYPE: ScriptFileType = SCRIPT_FILE_TYPES[0]!

export function scriptFileType(extension: string): ScriptFileType {
	return SCRIPT_FILE_TYPES.find((t) => t.extension === extension.toLowerCase()) ?? DEFAULT_SCRIPT_FILE_TYPE
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
