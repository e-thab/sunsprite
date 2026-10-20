import root, { type LibraryAttribution, type LibraryEntry, type LibraryFile, type LibraryFolder } from 'virtual:library'

// The built-in Library: everything under src/library, served at /library/*
// (see scripts/libraryPlugin.ts). The tree is scanned from disk at build/dev
// time, so adding or removing files there is all it takes to change what
// AssetLibrary.vue lists.
//
// Projects created before the Library moved here may still hold links to the
// old public/images/* paths (/images/cards/back.png, ...). Those files stay
// in public/ so the links keep working; they just aren't listed any more.

export type { LibraryAttribution, LibraryEntry, LibraryFile, LibraryFolder }

export const libraryRoot: LibraryFolder = root

// Only folders carry credits, and only a handful do, so a lookup walks up
// from the asset's own folder instead of indexing every file.
const attributionByFolder = new Map<string, LibraryAttribution>()

function indexAttributions(folder: LibraryFolder) {
	if (folder.attribution) attributionByFolder.set(folder.path, folder.attribution)
	for (const child of folder.children) {
		if (child.kind === 'folder') indexAttributions(child)
	}
}
indexAttributions(libraryRoot)

/** The credit covering a Library path, from its nearest attributed folder. */
export function attributionFor(path: string): LibraryAttribution | undefined {
	for (let end = path.lastIndexOf('/'); end > 0; end = path.lastIndexOf('/', end - 1)) {
		const attribution = attributionByFolder.get(path.slice(0, end))
		if (attribution) return attribution
	}
	return undefined
}

/** "Space Shooter Redux by Kenney", or just "Kenney" without a title. */
export function attributionLabel(attribution: LibraryAttribution): string {
	return attribution.title ? `${attribution.title} by ${attribution.author}` : attribution.author
}
