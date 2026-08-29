import { buildApiLib, type VersionedApiConstants } from '../apiLib'

// Every permanent snapshot's generated.ts (see scripts/snapshot-api.ts) mirrors
// the shape of ../generated/apiDeclarations.generated.ts — bare, ambient-ready
// string constants, the only per-version artifact meant to be loaded into
// Monaco. Each version's api.d.ts sits alongside it but is a separate,
// human-readable historical record with real import/export syntax; it's not
// used here. Lazy (no `eager: true`): versions accumulate over time and most
// will never be selected in a given session.
const versionModules = import.meta.glob<VersionedApiConstants>('./*/generated.ts')

const VERSION_RE = /^\.\/([^/]+)\/generated\.ts$/

/** Available permanent API versions (folder names under versions/), newest-looking first, best-effort. */
export function listApiVersions(): string[] {
    return Object.keys(versionModules)
        .map((path) => path.match(VERSION_RE)?.[1])
        .filter((v): v is string => !!v)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
}

/**
 * The tier a brand-new project is pinned to (see projectStore.ts's
 * createProject) — whatever cut version currently sorts newest. Falls back
 * to 'latest' only in the bootstrapping case where nothing has been cut yet.
 */
export function latestApiVersion(): string {
    return listApiVersions()[0] ?? 'latest'
}

/** Loads a historical version's ambient declaration text, ready for Monaco's addExtraLib. Undefined if the version doesn't exist. */
export async function loadVersionedApiLib(version: string): Promise<string | undefined> {
    const loader = versionModules[`./${version}/generated.ts`]
    if (!loader) return undefined
    const constants = await loader()
    return buildApiLib(constants)
}
