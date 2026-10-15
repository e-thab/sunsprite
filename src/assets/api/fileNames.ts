// Pure helpers for talking about project file names — no Phaser, no game
// state — so the editor (monaco-assets.ts) and the running game (assets.ts)
// word a missing file exactly the same way. Keep it import-free: the host
// bundle imports this directly, and anything it pulled in would come along.

export type AssetKind = 'image' | 'audio' | 'text'

export interface NamedAsset {
    name: string
    kind: AssetKind
}

/**
 * A bare file name ('player.png') rather than a path or URL — nothing that
 * could locate a file on its own. A bare name can only mean a project file,
 * so one that isn't in the project is a mistake worth reporting rather than
 * something to try fetching relative to whatever page the game runs in.
 */
export function isBareFileName(src: string): boolean {
    return !/[/\\:]/.test(src)
}

const KIND_LABELS: Record<AssetKind, { noun: string, article: string }> = {
    image: { noun: 'image', article: 'an' },
    audio: { noun: 'sound', article: 'a' },
    text: { noun: 'text file', article: 'a' },
}

function kindLabel(kind: AssetKind): string {
    return KIND_LABELS[kind].noun
}

/** 'an image', 'a sound', 'a text file'. */
function kindWithArticle(kind: AssetKind): string {
    const { noun, article } = KIND_LABELS[kind]
    return `${article} ${noun}`
}

/**
 * The message for a name that matches no project file of the wanted kind,
 * with the most likely intended name when there is one. Names are
 * case-sensitive everywhere in a project, which is the one rule here worth
 * spelling out when it's what went wrong.
 */
export function describeMissingFile(name: string, kind: AssetKind, assets: readonly NamedAsset[]): string {
    const otherKind = assets.find((asset) => asset.name === name && asset.kind !== kind)
    if (otherKind) return `'${name}' is ${kindWithArticle(otherKind.kind)}, not ${kindWithArticle(kind)}.`

    const missing = `No ${kindLabel(kind)} named '${name}' in this project.`
    const candidates = assets.filter((asset) => asset.kind === kind).map((asset) => asset.name)

    const caseMatch = candidates.find((candidate) => candidate.toLowerCase() === name.toLowerCase())
    if (caseMatch) return `${missing} Did you mean '${caseMatch}'? File names are case-sensitive.`

    const suggestion = closestName(name, candidates)
    return suggestion ? `${missing} Did you mean '${suggestion}'?` : missing
}

/**
 * The candidate within a couple of edits of `name`, if exactly one is
 * clearly closest. Compared case-insensitively — a case slip on top of a typo
 * is still the same mistake — and short names get less slack, so 'a.png'
 * doesn't "suggest" every other one-letter file.
 */
function closestName(name: string, candidates: readonly string[]): string | undefined {
    const maxDistance = name.length <= 6 ? 1 : 2
    let best: string | undefined
    let bestDistance = Infinity
    let tied = false

    for (const candidate of candidates) {
        const distance = editDistance(name.toLowerCase(), candidate.toLowerCase())
        if (distance > maxDistance) continue
        if (distance < bestDistance) {
            best = candidate
            bestDistance = distance
            tied = false
        } else if (distance === bestDistance) {
            tied = true
        }
    }

    return tied ? undefined : best
}

/** Levenshtein distance, one row at a time. */
function editDistance(a: string, b: string): number {
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
        const current = [i]
        for (let j = 1; j <= b.length; j++) {
            const substitution = previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)
            current.push(Math.min(previous[j]! + 1, current[j - 1]! + 1, substitution))
        }
        previous = current
    }
    return previous[b.length]!
}
