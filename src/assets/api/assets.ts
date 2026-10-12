import Phaser from 'phaser'
import type { ThemePalette } from '@/assets/theme/themes'
import type { ProjectAsset } from '@/sandbox/protocol'
import Output from '@/sandbox/output'
import { currentLocation } from '@api/moduleRunner'
import { describeMissingFile, isBareFileName } from '@api/fileNames'
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
 * An image: the name of an image file in your project, like 'player.png', or a URL.
 *
 * Plain `string` here; the editor's declarations narrow it to the project's
 * real file names for completion (see apiLib.ts's ImageSource and
 * CodeEditor.vue's project-assets lib), without rejecting a name built at
 * runtime like `'card_' + n + '.png'`.
 */
export type ImageSource = string

/** A sound: the name of an audio file in your project, like 'jump.mp3', or a URL. See ImageSource. */
export type AudioSource = string

/** The project's files for the current run, set by runUserCode before the game exists. */
let manifest: readonly ProjectAsset[] = []
let theme: ThemePalette | undefined

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
export function _setProjectAssets(assets: readonly ProjectAsset[], runTheme?: ThemePalette) {
    manifest = assets
    theme = runTheme
    failedNames.clear()
    reported.clear()

    // Forget files that have left the project, so a long session doesn't keep
    // every image anyone ever uploaded alive.
    const urls = new Set(assets.map((asset) => asset.url))
    for (const url of imageCache.keys()) if (!urls.has(url)) imageCache.delete(url)
    for (const url of audioCache.keys()) if (!urls.has(url)) audioCache.delete(url)
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
        const extension = audioExtension(asset.name)
        const type = playableAudioType(extension, scene.sys.game.device.audio)
        if (!type) {
            failedNames.add(asset.name)
            report(asset.name, `This browser can't play .${extension} files, so '${asset.name}' wasn't loaded.`)
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

    const hideProgress = showLoadingProgress(scene, new Set(pending.map((asset) => asset.name)))
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        hideProgress()
        collectLoaded(scene, pending, loadErrors)
    })
}

function audioExtension(name: string): string {
    return name.slice(name.lastIndexOf('.') + 1).toLowerCase()
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
        if (asset.kind === 'image' && scene.textures.exists(asset.name)) {
            const source = scene.textures.get(asset.name).getSourceImage()
            if (source instanceof HTMLImageElement) imageCache.set(asset.url, source)
            continue
        }
        if (asset.kind === 'audio' && scene.cache.audio.exists(asset.name)) {
            const buffer = scene.cache.audio.get(asset.name)
            if (buffer instanceof AudioBuffer) audioCache.set(asset.url, buffer)
            continue
        }

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
    Output.runtimeError(message)
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

function checkMissing(src: string, kind: 'image' | 'audio'): 'load' | 'missing' {
    if (failedNames.has(src)) return 'missing'
    if (!isBareFileName(src)) return 'load'

    if (!reported.has(src)) {
        reported.add(src)
        Output.runtimeWarning(describeMissingFile(src, kind, manifest), currentLocation())
    }
    return 'missing'
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

/**
 * A progress bar on the game canvas while the run's files download, removed
 * just before create() — and so the user's script — runs. Drawn in screen
 * pixels by the scene's own default camera, which is all there is this early:
 * the Sunsprite Camera/Screen/Background wrappers are only set up in create().
 * Returns the cleanup.
 */
function showLoadingProgress(scene: Phaser.Scene, pendingNames: ReadonlySet<string>): () => void {
    let graphics: Phaser.GameObjects.Graphics | undefined
    let label: Phaser.GameObjects.Text | undefined
    const total = pendingNames.size
    let settled = 0

    const accent = Phaser.Display.Color.ValueToColor(theme?.primary ?? '#ff69b4').color
    scene.cameras.main.setBackgroundColor(backgroundColor)

    const draw = () => {
        if (!graphics || !label) return
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
        label.setText(`Loading files… ${settled} / ${total}`)
    }

    // Counted per project file rather than read off the loader's own PROGRESS
    // fraction, which also counts anything else queued in the same batch.
    // A file that errors counts as settled too; one that downloads but fails
    // to decode fires neither event, which only leaves the bar a step short
    // for the moment before COMPLETE removes it.
    const onSettled = (file: Phaser.Loader.File | string) => {
        const key = typeof file === 'string' ? file : file.key
        if (!pendingNames.has(key)) return
        settled = Math.min(total, settled + 1)
        draw()
    }

    const timer = setTimeout(() => {
        graphics = scene.add.graphics()
        label = scene.add.text(0, 0, '', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            color: '#ffffffb3',
        }).setOrigin(0.5, 1)
        draw()
    }, PROGRESS_DELAY_MS)

    // FILE_COMPLETE's first argument is the key; FILE_LOAD_ERROR's is the File.
    scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, onSettled)
    scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onSettled)
    // The game is created at Phaser's default size and fitted to its panel a
    // tick later (see core.ts's resizeStage), usually after this has drawn.
    scene.scale.on(Phaser.Scale.Events.RESIZE, draw)

    const cleanup = () => {
        clearTimeout(timer)
        scene.load.off(Phaser.Loader.Events.FILE_COMPLETE, onSettled)
        scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onSettled)
        scene.scale.off(Phaser.Scale.Events.RESIZE, draw)
        scene.events.off(Phaser.Scenes.Events.DESTROY, cleanup)
        graphics?.destroy()
        label?.destroy()
        graphics = undefined
        label = undefined
    }
    // A restart while files are still downloading destroys this scene before
    // COMPLETE ever fires — without this, the pending timer would go on to
    // add the bar to a scene that no longer exists.
    scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup)
    return cleanup
}
