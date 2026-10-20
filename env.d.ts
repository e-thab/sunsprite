/// <reference types="vite/client" />

// The built-in Library's folder tree — see scripts/libraryPlugin.ts.
declare module 'virtual:library' {
	/**
	 * An attribution.json in a Library folder. Credits everything beneath that
	 * folder; a nested one overrides it for its own subtree.
	 */
	export interface LibraryAttribution {
		/** The pack or work's name, e.g. "Space Shooter Redux". */
		title?: string
		author: string
		/** Where the original can be found. */
		url?: string
		/** Short license name, e.g. "CC0 1.0". */
		license?: string
		licenseUrl?: string
	}

	export interface LibraryFile {
		kind: 'file'
		name: string
		/** Root-relative URL the file is served at, e.g. /library/images/cards/card_back.png. */
		path: string
	}

	export interface LibraryFolder {
		kind: 'folder'
		name: string
		path: string
		attribution?: LibraryAttribution
		children: LibraryEntry[]
	}

	export type LibraryEntry = LibraryFile | LibraryFolder

	/** src/library itself, served at /library. */
	const root: LibraryFolder
	export default root
}
