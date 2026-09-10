// Sandbox-only counterpart to ./index.ts (which is declarations-only, for the
// host-side Monaco editor). This loads the real, runnable source a permanent
// version snapshot froze — see scripts/snapshot-api.ts's runtime-copy step —
// imported exclusively by src/sandbox/main.ts, so Vite's code-splitting keeps
// every versioned core.ts copy out of the main host bundle entirely, the same
// way index.ts's own glob already does for declarations.

import { DEV_VERSION } from './constants'

export interface VersionedRuntimeModules {
    core: typeof import('@/assets/api/core')
    watch: typeof import('@/sandbox/watch')
}

// Both globbed together, not just core.ts: src/sandbox/main.ts imports
// collectWatchSnapshot from ./watch *directly*, independent of core.ts. If a
// versioned core.ts used its own copied watch.ts while main.ts kept reading
// the live one, user scripts' watch() calls (routed through the versioned
// core.ts) would populate a private `cards` map the status-report loop (still
// reading the live watch.ts) never sees — the Watch panel would silently show
// nothing for any snapshot version. Loading them as a pair is what keeps
// them talking to the same module instance.
const coreModules = import.meta.glob<typeof import('@/assets/api/core')>('./*/src/assets/api/core.ts')
const watchModules = import.meta.glob<typeof import('@/sandbox/watch')>('./*/src/sandbox/watch.ts')

/**
 * The runtime behind any selectable version: the live engine for 'dev' (see
 * ./constants.ts), a snapshot's own frozen copy for anything else. Undefined
 * if the version doesn't exist — main.ts treats that as "fall back to dev".
 */
export async function loadVersionedRuntime(version: string): Promise<VersionedRuntimeModules | undefined> {
    if (version === DEV_VERSION) return loadDevRuntime()

    const coreLoader = coreModules[`./${version}/src/assets/api/core.ts`]
    const watchLoader = watchModules[`./${version}/src/sandbox/watch.ts`]
    if (!coreLoader || !watchLoader) return undefined

    const [core, watch] = await Promise.all([coreLoader(), watchLoader()])
    return { core, watch }
}

/**
 * The 'dev' version (see ./constants.ts): the live engine as it stands in the
 * working tree, not a copy of it. Imported by real module specifier rather
 * than through the globs above, so it's the *same* module instance the rest of
 * the sandbox already has — and so this default case costs no extra chunk.
 */
export async function loadDevRuntime(): Promise<VersionedRuntimeModules> {
    const [core, watch] = await Promise.all([import('@/assets/api/core'), import('@/sandbox/watch')])
    return { core, watch }
}
