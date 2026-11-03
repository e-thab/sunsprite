import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { REPO_ROOT } from './aliases'

// The built-in Library (src/library) is served to the game as plain files at
// stable URLs — /library/images/cards/card_back.png — rather than imported
// through Vite, which would rename every file with a content hash. Projects
// store these paths (library_images.library_path) and users paste them into
// scripts, so they have to survive a rebuild unchanged.
//
// This plugin is what makes the folder itself the source of truth:
// - `virtual:library` is the folder's tree, scanned at build/dev time, so
//   AssetLibrary.vue lists exactly what's on disk with nothing hand-kept.
// - In dev, /library/* is rewritten onto Vite's own static serving of
//   src/library/* (which already sends the CORS headers the sandbox needs —
//   see vite.config.ts).
// - In a build, the folder is copied to <outDir>/library as-is.
//
// Any folder may hold an attribution.json crediting its contents (see
// LibraryAttribution in env.d.ts); it covers everything beneath that folder.

const LIBRARY_DIR = path.join(REPO_ROOT, 'src', 'library')
const URL_BASE = '/library'
const ATTRIBUTION_FILE = 'attribution.json'

const VIRTUAL_ID = 'virtual:library'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

// Several files dropped in at once each fire a watcher event; one reload
// covers them all.
const RELOAD_DEBOUNCE_MS = 100

type Attribution = { title?: string, author: string, url?: string, license?: string, licenseUrl?: string }
type Entry =
	| { kind: 'file', name: string, path: string }
	| { kind: 'folder', name: string, path: string, attribution?: Attribution, children: Entry[] }

// Same order as the project file tree (fileStore.ts's compareTreeNodes):
// folders first, then natural order, so laser2 sorts before laser10.
const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function compareEntries(a: Entry, b: Entry): number {
	if ((a.kind === 'folder') !== (b.kind === 'folder')) return a.kind === 'folder' ? -1 : 1
	return nameCollator.compare(a.name, b.name)
}

function readAttribution(file: string): Attribution {
	const relative = path.relative(REPO_ROOT, file)
	let data: unknown
	try {
		data = JSON.parse(fs.readFileSync(file, 'utf8'))
	} catch (err) {
		throw new Error(`${relative}: ${err instanceof Error ? err.message : err}`)
	}
	const record = data as Record<string, unknown>
	if (typeof record?.author !== 'string' || !record.author) {
		throw new Error(`${relative}: "author" is required`)
	}
	for (const key of ['title', 'url', 'license', 'licenseUrl']) {
		if (record[key] !== undefined && typeof record[key] !== 'string') {
			throw new Error(`${relative}: "${key}" must be a string`)
		}
	}
	return record as Attribution
}

function scanFolder(dir: string, urlPath: string): Entry & { kind: 'folder' } {
	const children: Entry[] = []
	let attribution: Attribution | undefined

	for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
		if (dirent.name.startsWith('.')) continue
		const childPath = path.join(dir, dirent.name)
		const childUrl = `${urlPath}/${dirent.name}`
		if (dirent.isDirectory()) children.push(scanFolder(childPath, childUrl))
		else if (dirent.name === ATTRIBUTION_FILE) attribution = readAttribution(childPath)
		else if (dirent.isFile()) children.push({ kind: 'file', name: dirent.name, path: childUrl })
	}

	children.sort(compareEntries)
	return { kind: 'folder', name: path.basename(dir), path: urlPath, attribution, children }
}

function isInLibrary(file: string): boolean {
	const relative = path.relative(LIBRARY_DIR, file)
	return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export function libraryPlugin(): Plugin {
	let outDir = ''

	return {
		name: 'sunsprite-library',

		configResolved(config) {
			outDir = path.resolve(config.root, config.build.outDir)
		},

		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID
		},

		load(id) {
			if (id !== RESOLVED_VIRTUAL_ID) return
			return `export default ${JSON.stringify(scanFolder(LIBRARY_DIR, URL_BASE))}`
		},

		configureServer(server: ViteDevServer) {
			// Registered directly (not returned as a post hook) so the rewrite
			// happens before Vite's own static middleware looks at the URL.
			server.middlewares.use((req, _res, next) => {
				if (req.url?.startsWith(`${URL_BASE}/`)) req.url = `/src${req.url}`
				next()
			})

			let reloadTimer: ReturnType<typeof setTimeout> | undefined
			const scheduleReload = (file: string) => {
				if (!isInLibrary(file)) return
				clearTimeout(reloadTimer)
				reloadTimer = setTimeout(() => {
					const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
					if (mod) server.moduleGraph.invalidateModule(mod)
					server.ws.send({ type: 'full-reload' })
				}, RELOAD_DEBOUNCE_MS)
			}
			server.watcher.on('add', scheduleReload)
			server.watcher.on('unlink', scheduleReload)
			server.watcher.on('addDir', scheduleReload)
			server.watcher.on('unlinkDir', scheduleReload)
			// An asset's own contents never change the tree; a credit does.
			server.watcher.on('change', (file) => {
				if (path.basename(file) === ATTRIBUTION_FILE) scheduleReload(file)
			})
		},

		writeBundle() {
			fs.cpSync(LIBRARY_DIR, path.join(outDir, URL_BASE), {
				recursive: true,
				filter: (source) => path.basename(source) !== ATTRIBUTION_FILE,
			})
		},
	}
}
