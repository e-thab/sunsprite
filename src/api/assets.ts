import Phaser from 'phaser'
import type { ThemePalette } from '@/theme/themes'
import type { OutputLocation, ProjectAsset, ProjectTextFile } from '@/sandbox/protocol'
import Output from '@/sandbox/output'
import { currentLocation } from '@api/moduleRunner'
import { describeMissingFile, isBareFileName, type NamedAsset } from '@api/fileNames'
import { _defaultColor as backgroundColor } from '@api/Background'

// Project files as game assets. Every image and sound in the file tree is
// preloaded before the entry script runs, keyed by the exact name the tree
// shows — so `new Sprite({ src: 'player.png' })` finds its texture already
// there, with no load delay and no invisible first frame.
//
// Every run builds a brand-new Phaser.Game (see core.ts's runUserCode), and
// destroying the old one throws away every texture and decoded sound it held.
// Loading the whole file tree again on every restart — and auto-run restarts
// on every edit — would make restart time grow with the project's size. So
// the decoded results are kept here, at module scope, which outlives every
// Game this sandbox document ever builds: a file only goes over the network
// (and through the image/audio decoder) the first time a run needs it, and
// every run after that hands Phaser the same image element / AudioBuffer
// directly. Keyed by URL rather than name, so renaming a file in the tree
// doesn't cost a reload.

/**
 * An image: the name of an image file in your project, like 'player.png', a name you gave one with load(), or a URL.
 *
 * Plain `string` here; the editor's declarations narrow it to the project's
 * real file names for completion (see apiLib.ts's ImageSource and
 * CodeEditor.vue's project-assets lib), without rejecting a name built at
 * runtime like `'card_' + n + '.png'`.
 */
export type ImageSource = string

/** A sound: the name of an audio file in your project, like 'jump.mp3', a name you gave one with load(), or a URL. See ImageSource. */
export type AudioSource = string

/** What load() can fetch, in the words scripts use: load()'s optional third argument. */
export type LoadType = 'image' | 'sound'

/** What a file loads as, in Phaser's terms: a texture or an entry in the audio cache. */
type MediaKind = ProjectAsset['kind']

/** What load() has been asked for under one name. `audioType` is what Phaser is told the format is, for a sound. */
type LoadRequest = { url: string, kind: MediaKind, audioType?: string }

/** The project's files for the current run, set by runUserCode before the game exists. */
let manifest: readonly ProjectAsset[] = []
let theme: ThemePalette | undefined

/**
 * Every text file's content for the current run, by name. Nothing to load or
 * cache across runs the way images and sounds are: the host sends the text
 * itself with every run, so this is simply replaced each time.
 */
let textFiles = new Map<string, string>()

const imageCache = new Map<string, HTMLImageElement>()
const audioCache = new Map<string, AudioBuffer>()

/**
 * Names whose preload failed this run. A failure is reported once, when
 * loading finishes; anything that later asks for the same name just gets the
 * missing-file fallback quietly, rather than a second, misleading "no file
 * named ..." for a file that does exist.
 */
const failedNames = new Set<string>()

/** Every name or URL already reported this run — a `forever` that keeps asking shouldn't flood the output. */
const reported = new Set<string>()

let sharedAudioContext: AudioContext | undefined

/**
 * What load() has been asked for this run, by name. Images and sounds share
 * one set of names, so a name used as the wrong kind can be explained. The URLs
 * also survive into the next run's cache pruning.
 */
let loadRequests = new Map<string, LoadRequest>()

/**
 * The line that first asked for each file loaded on demand this run, by the
 * key it's loaded under: load() calls, and path/URL sources. A failure points
 * back here, since it arrives from the loader long after the script's stack
 * has gone. Project files aren't in here: no line asks for those.
 */
const loadLocations = new Map<string, OutputLocation | undefined>()

/** Keys already warned about being used while still downloading, so it's only said once per key. */
const warnedStillLoading = new Set<string>()

/** Bumped every run, so a load finishing after a restart can tell it no longer belongs to the current game. */
let currentRun = 0

/** The progress bar for load() calls on the loader's current batch, if there is one. */
let loadProgress: { files: Map<string, MediaKind>, redraw: () => void, hide: () => void } | undefined

/**
 * One AudioContext for every Game this document builds, passed in through the
 * game config. Phaser closes a context it created itself when its Game is
 * destroyed; one handed to it is only suspended, and resumed by the next Game.
 * That keeps the cached AudioBuffers above playable without re-decoding, and
 * keeps audio unlocked across restarts — browsers start a context suspended
 * until the user interacts with the page, and a fresh context per run would
 * mean clicking the game again after every restart before it can make a sound.
 */
export function _sharedAudioContext(): AudioContext | undefined {
    if (sharedAudioContext) return sharedAudioContext
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) return undefined
    try {
        sharedAudioContext = new Context()
    } catch {
        // No Web Audio — Phaser falls back to HTML5 audio by itself.
    }
    return sharedAudioContext
}

/** Called by runUserCode at the start of every run, before the new Game is built. */
export function _setProjectAssets(assets: readonly ProjectAsset[], runTheme?: ThemePalette, runTextFiles: readonly ProjectTextFile[] = []) {
    manifest = assets
    theme = runTheme
    textFiles = new Map(runTextFiles.map((file) => [file.name, file.content]))
    failedNames.clear()
    reported.clear()
    warnedStillLoading.clear()
    loadLocations.clear()
    currentRun++
    // Now, not at the old scene's teardown: the compact bar isn't part of its canvas.
    loadProgress?.hide()
    loadProgress = undefined

    // Forget files that have left the project, so a long session doesn't keep
    // every image anyone ever uploaded alive. URLs the last run load()ed count
    // as still in use: the script that's about to run most likely asks for
    // them again, and auto-run restarts on every edit.
    const urls = new Set([...assets.map((asset) => asset.url), ...[...loadRequests.values()].map((request) => request.url)])
    for (const url of imageCache.keys()) if (!urls.has(url)) imageCache.delete(url)
    for (const url of audioCache.keys()) if (!urls.has(url)) audioCache.delete(url)
    loadRequests = new Map()
}

/**
 * Queues every project file onto the scene's loader, from UserScene.preload.
 * Anything decoded by an earlier run goes straight into the new Game's caches
 * instead. Phaser holds off create() — and with it the user's script — until
 * the loader is done, so everything is in place by the script's first line.
 */
export function _preloadProjectAssets(scene: Phaser.Scene) {
    const pending: ProjectAsset[] = []
    // Why each pending file failed, if the loader said — see collectLoaded.
    const loadErrors = new Map<string, string>()

    for (const asset of manifest) {
        if (asset.kind === 'image') {
            const cached = imageCache.get(asset.url)
            if (cached && scene.textures.addImage(asset.name, cached)) continue
            scene.load.image(asset.name, asset.url)
            pending.push(asset)
            continue
        }

        const cached = audioCache.get(asset.url)
        if (cached) {
            scene.cache.audio.add(asset.name, cached)
            continue
        }

        // Phaser picks an audio file's decoder from its URL's extension; an
        // R2 key keeps the original name's, but stating it is sturdier. And a
        // format the browser can't play is skipped by Phaser with only a
        // console warning, so it's checked (and explained) here instead.
        // The name's extension first, then the URL's: a sound added from a URL
        // can be named anything, and its URL needn't end in one either.
        const extension = [asset.name, asset.url].map(fileExtension).find((ext) => AUDIO_EXTENSIONS.has(ext)) ?? ''
        const type = audioLoadType(extension, scene.sys.game.device.audio)
        if (!type) {
            failedNames.add(asset.name)
            report(asset.name, `This browser can't play ${extension ? `.${extension} files` : 'sounds'}, so '${asset.name}' wasn't loaded.`)
            continue
        }
        scene.load.audio(asset.name, { url: asset.url, type })
        pending.push(asset)
    }

    // Failures from loads made *after* preload too (a Sprite pointed at a URL
    // mid-game, say) — Phaser otherwise only logs them to this iframe's own
    // console, which the user never sees. Pending project files are reported
    // together once loading finishes instead, where a decode failure (which
    // raises no event at all) can be caught alongside them.
    scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
        const reason = loadFailureReason(file)
        if (pending.some((asset) => asset.name === file.key)) {
            loadErrors.set(file.key, reason)
            return
        }
        report(file.key, `Couldn't load ${file.type === 'audio' ? 'sound' : 'image'} '${file.key}' (${reason}).`)
    })

    if (pending.length === 0) return

    // Too early for the Background wrapper to have set this itself.
    scene.cameras.main.setBackgroundColor(backgroundColor)
    const progress = showLoadingProgress(scene, new Map(pending.map((asset) => [asset.name, asset.kind])))
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        progress.hide()
        collectLoaded(scene, pending, loadErrors)
    })
}

/**
 * Extensions load() takes to mean a sound when it isn't told the type: every
 * format Phaser can check the browser for, not just the ones the project's
 * uploads allow, since a URL can point at anything.
 */
const AUDIO_EXTENSIONS = new Set(['mp3', 'ogg', 'wav', 'm4a', 'aac', 'opus', 'flac', 'webm'])

/**
 * The engine behind the API's load(): fetches an image or a sound under a name
 * of the script's choosing. Which one comes from `type` if the script gave one,
 * otherwise from the URL's extension. Phaser's loader works just as well after
 * preload as during it, and scripts can already wait on a promise at their top
 * level (imports rely on that too, see moduleRunner.ts), so this needs nothing
 * from the scene's preload phase.
 *
 * Always resolves, even if the file can't be loaded: that's reported, and a
 * rejection at a script's top level would stop the whole game over one file.
 * Never settles if the game restarts first, because the rest of the old script
 * would otherwise carry on and build its objects in the new game. The fade-out
 * in core.ts's retireGame leaves a real window for that: the old loader can
 * still finish after `scene` has moved on.
 */
export function _loadFile(scene: Phaser.Scene, key: string, url: string, type?: LoadType): Promise<void> {
    if (typeof key !== 'string' || typeof url !== 'string') {
        throw new Error(`load() needs names and URLs, like load('gator', 'https://example.com/gator.png') or load({ gator: 'https://example.com/gator.png' })`)
    }
    if (type !== undefined && type !== 'image' && type !== 'sound') {
        throw new Error(`load()'s third argument is the type of file, and must be 'image' or 'sound'.`)
    }

    const extension = fileExtension(url)
    const kind: MediaKind = type === 'sound' || (type === undefined && AUDIO_EXTENSIONS.has(extension)) ? 'audio' : 'image'

    // Phaser skips a key it already has without saying so, which would leave
    // the script using a different file than the URL it just asked for.
    const requested = loadRequests.get(key)
    const taken = requested !== undefined
        ? requested.url !== url || requested.kind !== kind
        : key !== url && (scene.textures.exists(key) || scene.cache.audio.exists(key) || manifest.some((asset) => asset.name === key))
    if (taken) {
        Output.runtimeWarning(`The name '${key}' is already used by another file, so this load() was ignored. Try a different name.`, currentLocation())
        return Promise.resolve()
    }

    // Asked for again: it either already arrived or already failed and was reported.
    if (isLoaded(scene, kind, key) || failedNames.has(key)) return Promise.resolve()

    if (requested === undefined && isBareFileName(key) && reported.has(key)) {
        Output.runtimeWarning(`'${key}' was used before this load() call. Move the load() above anything that uses it.`, currentLocation())
        // That report was about the earlier use. If this load fails, that still needs saying.
        reported.delete(key)
    }

    const audioType = kind === 'audio'
        ? audioLoadType(AUDIO_EXTENSIONS.has(extension) ? extension : '', scene.sys.game.device.audio)
        : undefined

    loadRequests.set(key, { url, kind, audioType })
    rememberLoadLocation(key)

    if (kind === 'audio' && !audioType) {
        failedNames.add(key)
        report(key, `This browser can't play ${extension ? `.${extension} files` : 'sounds'}, so '${key}' wasn't loaded.`)
        return Promise.resolve()
    }

    if (kind === 'image') {
        const cached = imageCache.get(url)
        if (cached && scene.textures.addImage(key, cached)) return Promise.resolve()
    } else {
        const cached = audioCache.get(url)
        if (cached) {
            scene.cache.audio.add(key, cached)
            return Promise.resolve()
        }
    }

    if (!loadProgress) {
        const files = new Map<string, MediaKind>()
        loadProgress = { files, ...showLoadingProgress(scene, files) }
    }
    loadProgress.files.set(key, kind)
    loadProgress.redraw()

    const run = currentRun
    return new Promise((resolve) => {
        scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
            if (run !== currentRun) return

            loadProgress?.hide()
            loadProgress = undefined

            if (!keepLoaded(scene, kind, key, url)) {
                failedNames.add(key)
                _reportFailedLoad(key, kind)
            }
            resolve()
        })
        if (kind === 'image') scene.load.image(key, url)
        else if (audioType) scene.load.audio(key, { url, type: audioType })
        scene.load.start()
    })
}

function isLoaded(scene: Phaser.Scene, kind: MediaKind, key: string): boolean {
    return kind === 'image' ? scene.textures.exists(key) : scene.cache.audio.exists(key)
}

/**
 * Whether a file the loader was given made it into the game's caches, keeping
 * it for the next run if it did.
 */
function keepLoaded(scene: Phaser.Scene, kind: MediaKind, key: string, url: string): boolean {
    if (!isLoaded(scene, kind, key)) return false
    if (kind === 'image') {
        const source = scene.textures.get(key).getSourceImage()
        if (source instanceof HTMLImageElement) imageCache.set(url, source)
    } else {
        const buffer = scene.cache.audio.get(key)
        if (buffer instanceof AudioBuffer) audioCache.set(url, buffer)
    }
    return true
}

/**
 * Where to fetch an image source with a 'load' status: the URL load() was given
 * if it's one of its image names, otherwise the source is its own URL. If load()
 * is still fetching it, Phaser ignores the repeat request for the same key.
 */
export function _imageUrl(src: string): string {
    const request = loadRequests.get(src)
    return request?.kind === 'image' ? request.url : src
}

/**
 * Same as _imageUrl, for a sound. A name from load() comes with the format
 * load() settled on, since its URL may not have an extension Phaser can read one from.
 */
export function _audioUrl(src: string): string | { url: string, type: string } {
    const request = loadRequests.get(src)
    return request?.kind === 'audio' && request.audioType ? { url: request.url, type: request.audioType } : src
}

/** A file name or URL's extension, lowercase, ignoring any query or fragment: 'mp3' for '…/jump.MP3?v=2'. Empty if there isn't one. */
function fileExtension(nameOrUrl: string): string {
    const path = nameOrUrl.split(/[?#]/)[0] ?? ''
    const name = path.slice(path.lastIndexOf('/') + 1)
    const dot = name.lastIndexOf('.')
    return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

/**
 * The type to hand Phaser's loader for a file extension, if this browser can
 * play it at all. Phaser re-checks the type against its device flags and
 * silently drops anything that fails. An .m4a is AAC in an MP4 container, and
 * Phaser probes for it as audio/x-m4a, which not every browser that decodes
 * it recognizes — so plain AAC support counts too.
 */
function playableAudioType(extension: string, device: Phaser.Device.Audio): string | undefined {
    if (extension === 'm4a') return device.m4a ? 'm4a' : device.aac ? 'aac' : undefined
    return device[extension as keyof Phaser.Device.Audio] ? extension : undefined
}

/**
 * The type to tell Phaser's loader a sound is, from its audio extension, or ''
 * when it has none. Phaser only uses the type to check the browser can play
 * it; the decoder goes by what's actually in the file. So a sound with no
 * extension to go on can be passed off as any format the browser supports.
 */
function audioLoadType(extension: string, device: Phaser.Device.Audio): string | undefined {
    if (extension) return playableAudioType(extension, device)
    return [...AUDIO_EXTENSIONS].map((format) => playableAudioType(format, device)).find((type) => type !== undefined)
}

function loadFailureReason(file: Phaser.Loader.File): string {
    const status = file.xhrLoader?.status
    return status ? `HTTP ${status}` : 'network error'
}

/**
 * Checks what actually made it into the caches rather than trusting the
 * loader's events, because audio that downloads fine but fails to decode
 * raises none. Whatever did arrive is kept for the next run.
 */
function collectLoaded(scene: Phaser.Scene, pending: readonly ProjectAsset[], loadErrors: ReadonlyMap<string, string>) {
    for (const asset of pending) {
        if (keepLoaded(scene, asset.kind, asset.name, asset.url)) continue

        failedNames.add(asset.name)
        const reason = loadErrors.get(asset.name)
        report(asset.name, reason
            ? `Couldn't load '${asset.name}' (${reason}).`
            : `Couldn't read '${asset.name}'. The file may be damaged, or in a format this browser can't open.`)
    }
}

function report(key: string, message: string) {
    if (reported.has(key)) return
    reported.add(key)
    Output.runtimeError(message, loadLocations.get(key))
}

/** Only the first line to ask is kept: it's the one a failure gets reported against, and a `forever` can keep asking. */
function rememberLoadLocation(key: string) {
    if (!loadLocations.has(key)) loadLocations.set(key, currentLocation())
}

/**
 * How an image source should be applied: already a texture, a path/URL to
 * load, or nothing usable (reported here, pointing at the user's own line).
 * Shared by everything that takes an image `src`, so a misspelt name reads
 * the same whether it went to a Sprite or the Background.
 */
export function _imageSourceStatus(textures: Phaser.Textures.TextureManager, src: string): 'ready' | 'load' | 'missing' {
    if (textures.exists(src)) return 'ready'
    return checkMissing(src, 'image')
}

/** Same as _imageSourceStatus, for a Sound's `src`. */
export function _audioSourceStatus(audio: Phaser.Cache.BaseCache, src: string): 'ready' | 'load' | 'missing' {
    if (audio.exists(src)) return 'ready'
    return checkMissing(src, 'audio')
}

function checkMissing(src: string, kind: MediaKind): 'load' | 'missing' {
    if (failedNames.has(src)) return 'missing'

    // A name from load(), not here yet. Whatever asked for it still gets the
    // file when it arrives, the same as a URL would.
    if (loadRequests.get(src)?.kind === kind) {
        if (!warnedStillLoading.has(src)) {
            warnedStillLoading.add(src)
            const consequence = kind === 'image' ? 'it will appear once it has' : `it won't play until it has`
            Output.runtimeWarning(`'${src}' hasn't finished loading, so ${consequence}. Did you forget to \`await\` its load()?`, currentLocation())
        }
        return 'load'
    }

    if (!isBareFileName(src)) {
        rememberLoadLocation(src)
        return 'load'
    }

    // Names from load() count as files here, so one used as the wrong kind
    // gets "'jump' is a sound, not an image." rather than "no image named".
    if (!reported.has(src)) {
        reported.add(src)
        const loaded = [...loadRequests].map(([name, request]) => ({ name, kind: request.kind }))
        Output.runtimeWarning(describeMissingFile(src, kind, [...manifest, ...loaded]), currentLocation())
    }
    return 'missing'
}

/**
 * A text file's content, for Files.read — undefined, reported once at the
 * user's own line, when there's no text file by that name. Unlike an image
 * src there's no URL fallback to try: a script can only read text that's in
 * the project, so any miss is a mistake worth pointing out.
 */
export function _projectTextFile(name: string): string | undefined {
    const content = textFiles.get(name)
    if (content !== undefined) return content

    if (!reported.has(name)) {
        reported.add(name)
        const known: NamedAsset[] = [...manifest, ...[...textFiles.keys()].map((textName) => ({ name: textName, kind: 'text' as const }))]
        Output.runtimeWarning(describeMissingFile(name, 'text', known), currentLocation())
    }
    return undefined
}

/**
 * Reports a path/URL `src` that was loaded on demand and didn't arrive, for
 * callers that check the cache on the loader's COMPLETE. Usually
 * FILE_LOAD_ERROR (above) has already said why; this catches the cases it
 * never fires for, like audio that downloaded but couldn't be decoded.
 */
export function _reportFailedLoad(src: string, kind: 'image' | 'audio') {
    report(src, `Couldn't load ${kind === 'audio' ? 'sound' : 'image'} '${src}'.`)
}

// Only appears if loading is still going after this long — a project whose
// files are all cached, or small, would otherwise flash a bar for a frame.
const PROGRESS_DELAY_MS = 150

/** One way of showing progress: how many files have settled out of how many, and one still going. */
type ProgressView = {
    draw: (settled: number, total: number, current: string, currentKind: MediaKind | undefined) => void
    destroy: () => void
}

/**
 * Progress while files download: the run's project files, removed just before
 * create() — and so the user's script — runs, or a script's own load() calls,
 * removed when the loader's batch finishes. `files` (name to kind) is read live,
 * so load() can add to a bar already up, calling redraw() to show it.
 *
 * The bar's style is picked when it appears: the big one while the canvas is
 * still empty, which covers a script's opening load()s too, and the compact one
 * once there's a game on screen not to cover.
 */
function showLoadingProgress(scene: Phaser.Scene, files: ReadonlyMap<string, MediaKind>): { redraw: () => void, hide: () => void } {
    let view: ProgressView | undefined
    let current = ''
    const settled = new Set<string>()

    // Files download in parallel and can finish in any order, so several may be
    // going at once. Moving on to the next unfinished one whenever a file settles
    // keeps the name changing with the count, rather than staying on a slow file
    // that the others overtake.
    const moveToNextFile = () => {
        const order = [...files.keys()]
        const start = order.indexOf(current) + 1
        current = [...order.slice(start), ...order.slice(0, start)].find((name) => !settled.has(name)) ?? current
    }

    const redraw = () => {
        if (!view) return
        if (!current) moveToNextFile()
        view.draw(settled.size, files.size, current, files.get(current))
    }

    // Tracked per file rather than read off the loader's own PROGRESS fraction,
    // which also counts anything else queued in the same batch. A file that
    // errors counts as settled too; one that downloads but fails to decode
    // fires neither event, which only leaves the bar a step short for the
    // moment before COMPLETE removes it.
    const onSettled = (file: Phaser.Loader.File | string) => {
        const key = typeof file === 'string' ? file : file.key
        if (!files.has(key)) return
        settled.add(key)
        moveToNextFile()
        redraw()
    }

    const timer = setTimeout(() => {
        view = scene.children.length === 0 ? centeredProgress(scene) : compactProgress()
        redraw()
    }, PROGRESS_DELAY_MS)

    // FILE_COMPLETE's first argument is the key; FILE_LOAD_ERROR's is the File.
    scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, onSettled)
    scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onSettled)
    // The game is created at Phaser's default size and fitted to its panel a
    // tick later (see core.ts's resizeStage), usually after this has drawn.
    scene.scale.on(Phaser.Scale.Events.RESIZE, redraw)

    const hide = () => {
        clearTimeout(timer)
        scene.load.off(Phaser.Loader.Events.FILE_COMPLETE, onSettled)
        scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onSettled)
        scene.scale.off(Phaser.Scale.Events.RESIZE, redraw)
        scene.events.off(Phaser.Scenes.Events.DESTROY, hide)
        view?.destroy()
        view = undefined
    }
    // A restart while files are still downloading destroys this scene before
    // COMPLETE ever fires — without this, the pending timer would go on to
    // add the bar to a scene that no longer exists.
    scene.events.once(Phaser.Scenes.Events.DESTROY, hide)
    return { redraw, hide }
}

/**
 * The big bar in the middle of an empty canvas. Drawn in screen pixels by the
 * scene's own default camera, which is all there is during preload: the
 * Sunsprite Camera/Screen/Background wrappers are only set up in create().
 */
function centeredProgress(scene: Phaser.Scene): ProgressView {
    // Scroll factor 0: a script calling load() may have moved the camera already.
    const graphics = scene.add.graphics().setScrollFactor(0)
    const label = scene.add.text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#ffffffb3',
    }).setOrigin(0.5, 1).setScrollFactor(0)
    const accent = Phaser.Display.Color.ValueToColor(accentColor()).color

    return {
        draw(settled, total) {
            const { width, height } = scene.scale
            const barWidth = Math.min(240, width * 0.6)
            const barHeight = 6
            const x = (width - barWidth) / 2
            const y = height / 2

            graphics.clear()
            graphics.fillStyle(0xffffff, 0.15)
            graphics.fillRoundedRect(x, y, barWidth, barHeight, barHeight / 2)
            if (settled > 0) {
                graphics.fillStyle(accent, 1)
                graphics.fillRoundedRect(x, y, Math.max(barHeight, barWidth * (settled / total)), barHeight, barHeight / 2)
            }

            label.setPosition(width / 2, y - 14)
            label.setText(`Loading files… (${settled}/${total})`)
        },
        destroy() {
            graphics.destroy()
            label.destroy()
        },
    }
}

/**
 * The small bar in the canvas's bottom-left corner, over a game already on
 * screen. Page elements rather than game objects, so the script's camera zoom
 * and depths can't move or hide it. The canvas fills this document, so the
 * corner of the page is the corner of the game. Only load() gets here: project
 * files load before anything's on screen.
 */
function compactProgress(): ProgressView {
    const box = document.createElement('div')
    box.style.cssText = 'position: fixed; left: 12px; bottom: 12px; box-sizing: border-box; min-width: 160px; max-width: calc(100% - 24px); padding: 6px 8px; border-radius: 6px; background: rgba(0, 0, 0, 0.6); color: rgba(255, 255, 255, 0.85); font: 12px system-ui, sans-serif; pointer-events: none;'
    const label = document.createElement('div')
    label.style.cssText = 'margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
    const track = document.createElement('div')
    track.style.cssText = 'height: 4px; border-radius: 2px; overflow: hidden; background: rgba(255, 255, 255, 0.15);'
    const fill = document.createElement('div')
    fill.style.cssText = `width: 0; height: 100%; background: ${accentColor()};`

    track.append(fill)
    box.append(label, track)
    document.body.append(box)

    return {
        draw(settled, total, current, currentKind) {
            label.textContent = `Loading ${currentKind === 'audio' ? 'sound' : 'image'} '${current}' (${settled}/${total})`
            fill.style.width = `${(settled / total) * 100}%`
        },
        destroy() {
            box.remove()
        },
    }
}

function accentColor(): string {
    return theme?.primary ?? '#ff69b4'
}
