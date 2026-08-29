import { apiLib, buildApiLib, type VersionedApiConstants } from '../apiLib'
import { DEV_VERSION } from './constants'

// Every permanent snapshot's generated.ts (see scripts/snapshot-api.ts) mirrors
// the shape of ../generated/apiDeclarations.generated.ts — bare, ambient-ready
// string constants, the only per-version artifact meant to be loaded into
// Monaco. Each version's api.d.ts sits alongside it but is a separate,
// human-readable historical record with real import/export syntax; it's not
// used here. Lazy (no `eager: true`): versions accumulate over time and most
// will never be selected in a given session.
const versionModules = import.meta.glob<VersionedApiConstants>('./*/generated.ts')

const VERSION_RE = /^\.\/([^/]+)\/generated\.ts$/

/**
 * Whether the editor offers DEV_VERSION as a selectable version at all —
 * development builds only. `import.meta.env.DEV` is true under `vite dev` and
 * statically `false` in anything `vite build` produces, so the dropdown row
 * and its label are dead code eliminated out of the production bundle rather
 * than merely hidden at runtime.
 *
 * Deliberately this rather than a `location.hostname === 'localhost'` check.
 * The distinction that matters isn't where the page is served from, it's
 * whether the API is still live: a production bundle has it frozen in at build
 * time, so a 'dev' row served from localhost via `vite preview` would be
 * tracking nothing — an unnamed snapshot wearing the dev label. This flag also
 * keeps working when the dev server is reached at a LAN address rather than
 * localhost (`vite dev --host`, i.e. testing on a phone), which a hostname
 * test would wrongly reject.
 *
 * Lives here rather than beside DEV_VERSION itself in ./constants.ts because
 * that module is also imported by scripts/snapshot-api.ts, which runs in Node
 * under tsx — `import.meta.env` doesn't exist there, and reading `.DEV` off it
 * at module scope would throw before the script ever reached main().
 */
export const DEV_VERSION_AVAILABLE = import.meta.env.DEV

/**
 * Available permanent API versions (folder names under versions/),
 * newest-looking first, best-effort. Snapshots only: DEV_VERSION is
 * deliberately not in here even though the editor offers it alongside these,
 * because latestApiVersion() below reads element 0 of this list to decide the
 * tier every *new project* is created against — and the sort is descending, so
 * a 'dev' entry would sort ahead of any numeric label and silently pin every
 * new project to a moving target (and to a value the
 * projects_api_version_format check constraint rejects outright). The one
 * caller that wants both concatenates them itself (CodeEditor.vue's version
 * dropdown, which renders them as two separate groups anyway).
 */
export function listApiVersions(): string[] {
    return Object.keys(versionModules)
        .map((path) => path.match(VERSION_RE)?.[1])
        .filter((v): v is string => !!v)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
}

/**
 * The tier a brand-new project is pinned to (see projectStore.ts's
 * createProject) — whatever cut version currently sorts newest. Falls back
 * to DEV_VERSION only in the bootstrapping case where nothing has been cut
 * yet; a project can't actually persist that (see the format constraint on
 * projects.api_version), which is fine — the fallback only exists for a repo
 * state that has no snapshots at all.
 */
export function latestApiVersion(): string {
    return listApiVersions()[0] ?? DEV_VERSION
}

/**
 * Declaration text for any selectable version, ready for Monaco's addExtraLib.
 * 'dev' hands back the live apiLib — the same string CodeEditor.vue installs
 * on first mount, built from src/assets/api/generated/apiDeclarations.generated.ts
 * rather than from a frozen copy of it. Undefined if the version doesn't exist.
 */
export async function loadVersionedApiLib(version: string): Promise<string | undefined> {
    if (version === DEV_VERSION) return apiLib

    const loader = versionModules[`./${version}/generated.ts`]
    if (!loader) return undefined
    const constants = await loader()
    return buildApiLib(constants)
}
