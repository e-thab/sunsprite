// import { camera, screen, timer, mouse, forever, repeat, repeatUntil, after, every, keyPressed, keyJustPressed, print, play, pause, setBackgroundColor } from "./core";
// import { deg2rad, rad2deg, sin, cos, tan, atan2, clamp } from "./utility";
// import { Point, Vector2 } from "./Point";

// import Sprite from "./Sprite"
// import Rectangle from "./Rectangle"
// import Label from "./Label"
// import Line from "./Line"
// import HLine from "./HLine"

// // Note: try dynamic imports

// const api = {
//     Sprite, Rectangle, Label, Line, HLine, Vector2, /*Point,*/
//     timer, screen, camera, mouse,
//     forever, repeat, repeatUntil, after, every,
//     keyPressed, keyJustPressed, print, play, pause, setBackgroundColor,
//     random, deg2rad, rad2deg, sin, cos, tan, atan2, clamp,
//     sqrt: Math.sqrt,
//     min: Math.min,
//     max: Math.max,
//     floor: Math.floor,
//     ceil: Math.ceil,
//     round: Math.round,
//     PI: Math.PI,
// }
// export default api
import {
    positionableApi,
    positionablePropsTypeDef, sizablePropsTypeDef, rotatablePropsTypeDef, viewablePropsTypeDef, interactablePropsTypeDef, alignablePropsTypeDef, alignableScreenSpaceDeclaration, anchorDeclaration,
    fillablePropsTypeDef, outlinablePropsTypeDef,
    spritePropsFields, spritePropsOmitted, spriteMembers, tintModeNameDeclaration, blendModeNameDeclaration,
    rectanglePropsFields, rectanglePropsOmitted, rectangleMembers,
    circlePropsFields, circlePropsOmitted, circleMembers,
    labelPropsFields, labelPropsOmitted, labelMembers,
    linePropsFields, linePropsOmitted, lineMembers,
    hLinePropsFields, hLinePropsOmitted, hLineMembers,
    vLinePropsFields, vLinePropsOmitted, vLineMembers,
    soundPropsFields, soundMembers, busMembers, busPropsDeclaration, mixerMembers,
    cameraMembers, vector2Members, timerMembers, clockMembers, screenMembers, mouseMembers,
    randomMembers, filesMembers, backgroundMembers, backgroundStyleDeclaration, backgroundPropsDeclaration,
    mouseDoc, screenDoc, clockDoc, cameraDoc, backgroundDoc, randomDoc, filesDoc, timerDoc, vector2Doc, spriteDoc, rectangleDoc, lineDoc, vLineDoc, hLineDoc, labelDoc, circleDoc, soundDoc, busDoc, mixerDoc,
    foreverDeclaration, repeatDeclaration, repeatUntilDeclaration, repeatWhileDeclaration,
    afterDeclaration, everyDeclaration, whenDeclaration, waitDeclaration, loadDeclaration,
    keyPressedDeclaration, keyJustPressedDeclaration, keyJustReleasedDeclaration,
    onKeyPressDeclaration, onKeyReleaseDeclaration, onKeyHoldDeclaration, onMouseDeclaration,
    pauseDeclaration, playDeclaration, printDeclaration,
    watchDeclaration, unwatchDeclaration,
    deg2radDeclaration, rad2degDeclaration, sinDeclaration, cosDeclaration, tanDeclaration, atan2Declaration, clampDeclaration, smoothStepDeclaration, smoothDampDeclaration, smoothFollowDeclaration,
} from "./generated/apiDeclarations.generated"
import type { AssetKind, NamedAsset } from "./fileNames"
import { libTypesDeclaration } from "./libTypes"

/**
 * The subset of apiLib's content that varies by API version — everything
 * produced by scripts/api-codegen (see src/api/generated/apiDeclarations.generated.ts
 * and each versions/<version>/generated.ts), plus the hand-written supporting
 * types and color names a snapshot freezes alongside them. The rest of
 * buildApiLib's hand-written text stays fixed across versions; only these get
 * swapped when hot-loading a historical version into Monaco (see
 * src/api/versions/index.ts).
 */
export interface VersionedApiConstants {
    // Optional, as are colorTable below: snapshots cut before these were
    // frozen don't export them, and fall back to the live ones.
    /** libTypes.ts's hand-written supporting types, as of the snapshot. */
    libTypesDeclaration?: string
    /** Every Colors name and its hex value, as of the snapshot — see monaco-colors.ts. */
    colorTable?: Record<string, string>
    positionableApi: string
    positionablePropsTypeDef: string
    sizablePropsTypeDef: string
    rotatablePropsTypeDef: string
    viewablePropsTypeDef: string
    interactablePropsTypeDef: string
    alignablePropsTypeDef: string
    // Optional: snapshots cut before screenSpace existed don't export it.
    alignableScreenSpaceDeclaration?: string
    // Optional: snapshots cut before the Anchor enum was exposed don't export it.
    anchorDeclaration?: string
    fillablePropsTypeDef: string
    outlinablePropsTypeDef: string
    spritePropsFields: string
    // Optional, as are the other *PropsOmitted: snapshots cut before
    // class-level @default tags reached the declarations don't export them.
    spritePropsOmitted?: string
    spriteMembers: string
    // Optional: snapshots cut before sprite tinting existed don't export it.
    tintModeNameDeclaration?: string
    // Optional: snapshots cut before it existed don't export it.
    blendModeNameDeclaration?: string
    rectanglePropsFields: string
    rectanglePropsOmitted?: string
    rectangleMembers: string
    circlePropsFields: string
    circlePropsOmitted?: string
    circleMembers: string
    labelPropsFields: string
    labelPropsOmitted?: string
    labelMembers: string
    linePropsFields: string
    linePropsOmitted?: string
    lineMembers: string
    hLinePropsFields: string
    hLinePropsOmitted?: string
    hLineMembers: string
    vLinePropsFields: string
    vLinePropsOmitted?: string
    vLineMembers: string
    soundPropsFields: string
    soundMembers: string
    // Optional: snapshots cut before buses/the Mixer existed don't export
    // these, and buildApiLib leaves Bus/BusProps/Mixer out for them.
    busMembers?: string
    busPropsDeclaration?: string
    mixerMembers?: string
    cameraMembers: string
    vector2Members: string
    timerMembers: string
    clockMembers: string
    screenMembers: string
    mouseMembers: string
    randomMembers: string
    // Optional: snapshots cut before Files existed don't export these, and
    // buildApiLib leaves the whole Files section out for them.
    filesMembers?: string
    backgroundMembers: string
    backgroundStyleDeclaration: string
    backgroundPropsDeclaration: string
    // Each class/singleton's own doc comment, straight from its source declaration.
    mouseDoc: string
    screenDoc: string
    clockDoc: string
    cameraDoc: string
    backgroundDoc: string
    randomDoc: string
    filesDoc?: string
    timerDoc: string
    vector2Doc: string
    spriteDoc: string
    rectangleDoc: string
    lineDoc: string
    vLineDoc: string
    hLineDoc: string
    labelDoc: string
    circleDoc: string
    soundDoc: string
    busDoc?: string
    mixerDoc?: string
    foreverDeclaration: string
    repeatDeclaration: string
    repeatUntilDeclaration: string
    repeatWhileDeclaration: string
    afterDeclaration: string
    everyDeclaration: string
    whenDeclaration: string
    // Optional: snapshots cut before wait existed don't export it.
    waitDeclaration?: string
    // Likewise for load.
    loadDeclaration?: string
    keyPressedDeclaration: string
    keyJustPressedDeclaration: string
    keyJustReleasedDeclaration: string
    onKeyPressDeclaration: string
    onKeyReleaseDeclaration: string
    onKeyHoldDeclaration: string
    onMouseDeclaration: string
    pauseDeclaration: string
    playDeclaration: string
    printDeclaration: string
    watchDeclaration: string
    unwatchDeclaration: string
    deg2radDeclaration: string
    rad2degDeclaration: string
    sinDeclaration: string
    cosDeclaration: string
    tanDeclaration: string
    atan2Declaration: string
    clampDeclaration: string
    // Optional: snapshots cut before smoothStep existed don't export it.
    smoothStepDeclaration?: string
    // Optional: snapshots cut before smoothDamp existed don't export it.
    smoothDampDeclaration?: string
    // Optional: snapshots cut before smoothFollow existed don't export it.
    smoothFollowDeclaration?: string
}

/**
 * A class's props base, less the inherited fields the class re-declares with
 * its own class-level `@default` (Sprite's `width`) — otherwise the editor
 * would show both fields' docs, the mixin's default and the class's, at once.
 */
function propsBase(base: string, omitted: string | undefined): string {
    return omitted ? `Omit<${base}, ${omitted}>` : base
}

// TODO: Maybe each lib 'module' (Random, Colors, etc.) should be its own model
// so that peeking definitions doesn't look so crowded?

// TODO: Fix all this vvv, model and lib should probably just stay the same for now

// Colors is deliberately declared as an index signature rather than the
// `declare enum Colors { AliceBlue = "#f0f8ff", ... }` this used to emit.
//
// The enum's members were TypeScript's to complete, and Monaco's TypeScript
// worker can only ever label them Property — its convertKind never emits
// CompletionItemKind.Color, which is what makes the suggest widget draw a
// color swatch. Handing the member list to our own provider (see
// monaco-colors.ts) is the only way to get swatches, and an index signature is
// what stops TypeScript offering the same names alongside ours: Monaco
// de-duplicates nothing between providers, so both lists would show — every
// color twice.
//
// Nothing downstream is weakened by the looser type: no API surface takes a
// Colors value, every color property is a plain `string`. The one thing the
// enum did give — an error on a misspelt name — is reinstated as a marker in
// monaco-colors.ts. Put the enum back and the duplicate rows come back too.
/** 
 * Added to the editor as a model, allows viewing definitions and better ts
 * support, but can't have direct const declarations. User-facing.
 */
export const apiModel = `
declare const Colors: { readonly [name: string]: string }
`

/**
 * Added to the editor as a library, definitions are not added to the model
 * but general type information is still displayed. Internal.
 *
 * Wrapped in `declare global` because this lib has no import/export of its
 * own: under the editor's `moduleDetection: "force"` setting (which makes
 * project scripts require explicit imports from each other), a script-like
 * file with no top-level import/export would otherwise be scoped to itself
 * instead of staying globally ambient to every script.
 */
export function buildApiLib(v: VersionedApiConstants): string {
    return 'declare global {\n' + [
// Types
// `
// declare enum Colors ${
//     // Colors is just an object, but works better as an enum here so it needs conversion
//     JSON.stringify(Colors, null, 2) // Convert to pretty string with newlines & tabs
//     .replace(/"([^"]+)":/g, '$1 =') // Unquote keys and replace colons with =
// }`,

// PointArgs include union w/ number[] in setter params because
// JS array literals are inferred as <T>[], not [<T>, <T>, ...]
`
${v.positionablePropsTypeDef}
${v.sizablePropsTypeDef}
${v.rotatablePropsTypeDef}
${v.viewablePropsTypeDef}
${v.interactablePropsTypeDef}
${v.alignablePropsTypeDef}
${v.alignableScreenSpaceDeclaration ?? ''}
${v.anchorDeclaration ?? ''}
${v.fillablePropsTypeDef ?? `declare type FillableProps = {}`}
${v.outlinablePropsTypeDef ?? `declare type OutlinableProps = {}`}
`,

// Types (hand-written — not derived from source; frozen per version, see libTypes.ts)
v.libTypesDeclaration ?? libTypesDeclaration,

// Core
`
${v.mouseDoc}declare const Mouse: {
${v.mouseMembers}
}

${v.screenDoc}declare const Screen: {
${v.screenMembers}
}

${v.timerDoc}class Timer {
    constructor()

${v.timerMembers}
}

${v.clockDoc}declare const Clock: {
${v.clockMembers}
}

${v.cameraDoc}declare const Camera: {
${v.cameraMembers}
}

${v.vector2Doc}class Vector2 {
    constructor(x: number, y: number)

${v.vector2Members}
}

/**
 * An array of all keys currently pressed.
 */
declare const keysPressed: string[]

/**
 * Keys that were just pressed this frame, mapped to the frame they were pressed on.
 */
declare const keysJustPressed: Map<string, number | undefined>

/**
 * Keys that were just released this frame, mapped to the frame they were released on.
 */
declare const keysJustReleased: Map<string, number | undefined>

${v.backgroundStyleDeclaration}

${v.backgroundPropsDeclaration}

${v.backgroundDoc}declare const Background: {
${v.backgroundMembers}
}

${v.foreverDeclaration}

${v.repeatDeclaration}

${v.repeatUntilDeclaration}

${v.repeatWhileDeclaration}

${v.afterDeclaration}

${v.everyDeclaration}

${v.whenDeclaration}

${v.waitDeclaration ?? ''}

${v.loadDeclaration ?? ''}

${v.keyPressedDeclaration}

${v.keyJustPressedDeclaration}

${v.keyJustReleasedDeclaration}

${v.onKeyPressDeclaration}

${v.onKeyReleaseDeclaration}

${v.onKeyHoldDeclaration}

${v.onMouseDeclaration}

${v.pauseDeclaration}

${v.playDeclaration}

/**
 * The browser's dev tools console. Not part of the Sunsprite API, use print/warn/err instead to show
 * messages in the output panel.
 */
declare const console: {
    log(...data: any[]): void
    info(...data: any[]): void
    debug(...data: any[]): void
    warn(...data: any[]): void
    error(...data: any[]): void
    trace(...data: any[]): void
    table(...data: any[]): void
    group(...data: any[]): void
    groupEnd(): void
    time(label?: string): void
    timeEnd(label?: string): void
    count(label?: string): void
    assert(condition?: boolean, ...data: any[]): void
    clear(): void
}`,

// Utilities
`
${v.randomDoc}declare const Random: {
${v.randomMembers}
}
${v.filesMembers === undefined ? '' : `
${v.filesDoc ?? ''}declare const Files: {
${v.filesMembers}
}
`}
/**
 * Throw to report a problem without the fatal-looking treatment of a thrown
 * Error — an uncaught Warning shows in the output panel styled as a warning
 * instead of an error, with its line highlighted in the warning color.
 */
class Warning extends Error {
    constructor(message?: string)
}

declare const Output: {
    /**
     * Display a normal message in the output panel.
     * @param msgs The messages to display.
     */
    print(...msgs: Printable[]): void,

    /**
     * Display a warning message in the output panel.
     * @param msgs The warning messages to display.
     */
    warn(...msgs: Printable[]): void,

    /**
     * Display an error message in the output panel.
     * @param msgs The error messages to display.
     */
    error(...msgs: Printable[]): void,

    /**
     * Clear all messages from the output panel.
     */
    clear(): void
}

${v.printDeclaration}

${v.watchDeclaration}

${v.unwatchDeclaration}

${v.deg2radDeclaration}

${v.rad2degDeclaration}

${v.sinDeclaration}

${v.cosDeclaration}

${v.tanDeclaration}

${v.atan2Declaration}

${v.clampDeclaration}

${v.smoothStepDeclaration ?? ''}

${v.smoothDampDeclaration ?? ''}

${v.smoothFollowDeclaration ?? ''}

/**
 * Returns the square root of a number.
 * @param num A number.
 */
declare function sqrt(num: number): number

/**
 * Returns the minimum of any number of arguments.
 * @param nums Any number of values.
 */
declare function min(...nums: number[]): number

/**
 * Returns the maximum of any number of arguments.
 * @param nums Any number of values.
 */
declare function max(...nums: number[]): number

/**
 * Returns a number rounded down to the nearest integer.
 * @param num A number.
 */
declare function floor(num: number): number

/**
 * Returns a number rounded up to the nearest integer.
 * @param num A number.
 */
declare function ceil(num: number): number

/**
 * Returns a number rounded to the nearest integer. When num has a decimal portion of exactly 0.5, it is rounded up even when negative. e.g. (1.5  ->  2.0) and (-1.5  ->  -1.0)
 * @param num A number.
 */
declare function round(num: number): number

/**
 * The ratio of the circumference of a circle to its diameter.
 */
const PI = ${Math.PI}`,

// Sprite
// TODO: include default values
`
type SpriteProps = ${propsBase('GameObjectProps', v.spritePropsOmitted)} & {
${v.spritePropsFields}
}

${v.tintModeNameDeclaration ?? ''}

${v.blendModeNameDeclaration ?? ''}

${v.spriteDoc}class Sprite {
    /**
     * The Sprite class. TODO: describe
     * @param options TODO: describe
     */
    constructor(options?: SpriteProps)

${v.spriteMembers}
}`,

// Rectangle
`
type RectangleProps = ${propsBase('ShapeProps', v.rectanglePropsOmitted)} & {
${v.rectanglePropsFields}
}

${v.rectangleDoc}class Rectangle {
    /**
     * The Rectangle class. TODO: describe
     * @param options TODO: describe
     */
    constructor(options?: RectangleProps)

${v.rectangleMembers}
}`,

// Line
// TODO: figure out why monaco doesn't like Returnable<PointArg> for plain point
// setters. Using [x, y] to define a point in the props object is no problem, but
// when just doing something like line.pointA = [x, y] it raises an error along
// the lines of 'number[] not assignable to [number, number] (Target requires 2 element(s) but source may have fewer)'
`type LineProps = ${propsBase('RotatableProps & ViewableProps', v.linePropsOmitted)} & {
${v.linePropsFields}
}

${v.lineDoc}class Line {
    /**
     * A straight line from point A to point B.
     * @param options TODO: describe
     */
    constructor(options?: LineProps)

${v.lineMembers}
}`,

// VLine
`type VLineProps = ${propsBase('ViewableProps', v.vLinePropsOmitted)} & {
${v.vLinePropsFields}
}

${v.vLineDoc}class VLine {
    /**
     * A straight, infinitely long vertical line.
     * @param options TODO: describe
     */
    constructor(options?: VLineProps)

${v.vLineMembers}
}`,

// HLine
`type HLineProps = ${propsBase('ViewableProps', v.hLinePropsOmitted)} & {
${v.hLinePropsFields}
}

${v.hLineDoc}class HLine {
    /**
     * A straight, infinitely long horizontal line.
     * @param options TODO: describe
     */
    constructor(options?: HLineProps)

${v.hLineMembers}
}`,

// Label
`type LabelProps = ${propsBase('GameObjectProps', v.labelPropsOmitted)} & {
${v.labelPropsFields}
}

${v.labelDoc}class Label {
    /**
     * An object that displays text. TODO: describe (better)
     * @param options TODO: describe
     */
    constructor(options?: LabelProps)

${v.labelMembers}
}`,

// Circle
`type CircleProps = ${propsBase('ShapeProps', v.circlePropsOmitted)} & {
${v.circlePropsFields}
}

${v.circleDoc}class Circle {
    /**
     * A basic circle shape. TODO: describe (better)
     * @param options TODO: describe
     */
    constructor(options?: CircleProps)

${v.circleMembers}
}`,

// Sound
`type SoundProps = {
${v.soundPropsFields}
}

${v.soundDoc}class Sound {
    /**
     * A sound that can play an audio file.
     * @param options The sound's initial properties.
     */
    constructor(options?: SoundProps)

${v.soundMembers}
}
${v.busMembers === undefined ? '' : `
${v.busPropsDeclaration ?? ''}

${v.busDoc ?? ''}interface Bus {
${v.busMembers}
}
`}${v.mixerMembers === undefined ? '' : `
${v.mixerDoc ?? ''}declare const Mixer: {
${v.mixerMembers}
}
`}`,
    ].join('\n') + '\n}\nexport {}'
}

/**
 * Declares the project's own file names, which ImageSource/AudioSource/
 * TextSource above build on. Its own lib rather than part of buildApiLib's
 * output: it changes whenever a file is added, renamed, or removed, which is
 * far more often than the API itself does, and is the same regardless of API
 * version. Always installed — with no files the unions are `never`, which
 * still leaves the *Source types as plain strings.
 */
export function buildProjectAssetsLib(assets: readonly NamedAsset[]): string {
    const union = (kind: AssetKind) => {
        const names = assets.filter((asset) => asset.kind === kind).map((asset) => JSON.stringify(asset.name))
        return names.length ? names.join(' | ') : 'never'
    }
    return `declare global {
/** The name of an image file in this project. */
type ImageFile = ${union('image')}

/** The name of an audio file in this project. */
type AudioFile = ${union('audio')}

/** The name of a text file in this project. */
type TextFile = ${union('text')}
}
export {}`
}

export const apiLib = buildApiLib({
    positionableApi,
    positionablePropsTypeDef, sizablePropsTypeDef, rotatablePropsTypeDef, viewablePropsTypeDef, interactablePropsTypeDef, alignablePropsTypeDef, alignableScreenSpaceDeclaration, anchorDeclaration,
    fillablePropsTypeDef, outlinablePropsTypeDef,
    spritePropsFields, spritePropsOmitted, spriteMembers, tintModeNameDeclaration, blendModeNameDeclaration,
    rectanglePropsFields, rectanglePropsOmitted, rectangleMembers,
    circlePropsFields, circlePropsOmitted, circleMembers,
    labelPropsFields, labelPropsOmitted, labelMembers,
    linePropsFields, linePropsOmitted, lineMembers,
    hLinePropsFields, hLinePropsOmitted, hLineMembers,
    vLinePropsFields, vLinePropsOmitted, vLineMembers,
    soundPropsFields, soundMembers, busMembers, busPropsDeclaration, mixerMembers,
    cameraMembers, vector2Members, timerMembers, clockMembers, screenMembers, mouseMembers,
    randomMembers, filesMembers, backgroundMembers, backgroundStyleDeclaration, backgroundPropsDeclaration,
    mouseDoc, screenDoc, clockDoc, cameraDoc, backgroundDoc, randomDoc, filesDoc, timerDoc, vector2Doc, spriteDoc, rectangleDoc, lineDoc, vLineDoc, hLineDoc, labelDoc, circleDoc, soundDoc, busDoc, mixerDoc,
    foreverDeclaration, repeatDeclaration, repeatUntilDeclaration, repeatWhileDeclaration,
    afterDeclaration, everyDeclaration, whenDeclaration, waitDeclaration, loadDeclaration,
    keyPressedDeclaration, keyJustPressedDeclaration, keyJustReleasedDeclaration,
    onKeyPressDeclaration, onKeyReleaseDeclaration, onKeyHoldDeclaration, onMouseDeclaration,
    pauseDeclaration, playDeclaration, printDeclaration,
    watchDeclaration, unwatchDeclaration,
    deg2radDeclaration, rad2degDeclaration, sinDeclaration, cosDeclaration, tanDeclaration, atan2Declaration, clampDeclaration, smoothStepDeclaration, smoothDampDeclaration, smoothFollowDeclaration,
})