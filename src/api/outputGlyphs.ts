// Icon glyphs for the output panel's stamp column.
//
// Stamps sit on the panel's hot path — output.ts recycles a fixed pool of rows
// and repaints them once per frame — which rules out a <UIcon> per stamp twice
// over: it would mount a Vue component per row, and @iconify/vue resolves names
// like `tabler:point-filled` by fetching icon data from api.iconify.design at
// runtime, since no @iconify-json collection is installed here.
//
// So each glyph is a CSS mask built from SVG files bundled at build time.
// Painting a glyph is then a single className write, the shape still inherits
// the row's theme color through currentColor (so error/warn/start stamps stay
// theme-reactive exactly as the text symbols they replaced did), and nothing
// touches the network.
//
// Every stamp is exactly one glyph, which is why the column can be a fixed
// width: a repeat count is a whole-number icon rather than composed digits, and
// anything past 99 is an infinity sign rather than a number plus a marker.

import pointSvg from '@tabler/icons/filled/point.svg?raw'
import alertSvg from '@tabler/icons/filled/alert-triangle.svg?raw'
import infinitySvg from '@tabler/icons/outline/infinity.svg?raw'
import sunspriteSvg from '@/assets/icons/sun.svg?raw'
import { NUMBER_SVGS } from '@api/outputNumberGlyphs'
import type { NumberGlyphKey } from '@api/outputNumberGlyphs'

/** `n0`–`n99` are the whole-number icons; the rest are the per-kind symbols. */
export type GlyphKey = 'point' | 'alert' | 'sunsprite' | 'infinity' | NumberGlyphKey

type Crop = readonly [x: number, y: number, width: number, height: number]

type GlyphSource = {
    svg: string
    /** viewBox crop, or null to keep the source's own box. */
    crop: Crop | null
    /**
     * How the mask is scaled inside the fixed slot: 'tall' sizes it by height,
     * so its ink lines up with everything else on the 12-unit band below;
     * 'wide' caps it at the slot's width instead, for the two glyphs too wide
     * to fit at full height.
     */
    fit: 'tall' | 'wide'
}

// Tabler puts `number-*-small` on a cell grid: one digit occupies x 10–14, two
// digits sit in cells at x 6–10 and 14–18, and every one of them inks the same
// y 7–17 band. Each crop is the cell span plus two units of air on every side,
// which keeps one- and two-digit glyphs at a consistent visual density.
//
// The infinity sign inks y 7–17 too, so it shares that band exactly — it only
// needs its own crop because it spans the full width (x 2–22).
const DIGIT1_CROP: Crop = [8, 6, 8, 12]
const DIGIT2_CROP: Crop = [4, 6, 16, 12]
const INFINITY_CROP: Crop = [0, 6, 24, 12]

// The sunsprite logo is drawn small and low inside a 256×256 box — its ink runs
// y 59–195 — so without a crop it would render at about half the height of
// everything else.
const SUNSPRITE_CROP: Crop = [0, 58, 256, 138]

// Assembled as a loose map because the number glyphs are filled in by loop,
// then asserted back to the closed key set so every lookup below is total.
const sources: Record<string, GlyphSource> = {
    point: { svg: pointSvg, crop: null, fit: 'tall' },
    alert: { svg: alertSvg, crop: null, fit: 'tall' },
    infinity: { svg: infinitySvg, crop: INFINITY_CROP, fit: 'wide' },
    sunsprite: { svg: sunspriteSvg, crop: SUNSPRITE_CROP, fit: 'wide' },
}

NUMBER_SVGS.forEach((svg, n) => {
    sources[`n${n}`] = { svg, crop: n < 10 ? DIGIT1_CROP : DIGIT2_CROP, fit: 'tall' }
})

const GLYPHS = sources as Record<GlyphKey, GlyphSource>
const GLYPH_KEYS = Object.keys(GLYPHS) as GlyphKey[]

/**
 * Precomputed `class` strings, so painting a glyph never concatenates. Fit
 * carries the sizing and the key carries the mask, which keeps the geometry
 * hand-written in OutputPane.vue and only the mask URLs generated.
 */
export const GLYPH_CLASS = Object.fromEntries(
    GLYPH_KEYS.map((key) => [key, `output-glyph output-glyph--${GLYPHS[key].fit} output-glyph--${key}`])
) as Record<GlyphKey, string>

// Every repeat count a stamp can show, built once. The hot path indexes this
// rather than composing per message, so a run of repeats allocates nothing.
const COUNT_GLYPHS: readonly GlyphKey[] =
    Array.from({ length: 100 }, (_, n) => `n${n}` as GlyphKey)

/** The "4" / "47" / "∞" stamp a run of identical messages collapses into. */
export function countGlyph(count: number): GlyphKey {
    return count > 99 ? 'infinity' : COUNT_GLYPHS[count]!
}

const TABLER_BACKGROUND_PATH = '<path stroke="none" d="M0 0h24v24H0z" fill="none" />'

function prepare(source: GlyphSource): string {
    // Collapsing the source's attribute-per-line formatting, and dropping both
    // the tabler class names and the transparent background path every tabler
    // icon carries, takes about a quarter off the generated stylesheet. Neither
    // can affect a mask: one is never matched, the other never painted. Both
    // are no-ops on the sunsprite logo, which carries neither.
    //
    // currentColor becomes an explicit black at the same time. A mask reads
    // only the alpha channel, and inside an isolated SVG image document
    // currentColor has no host element to inherit from — pinning it to an
    // opaque color says outright that "painted" means "shows through", leaving
    // nothing for a browser to resolve differently. A glyph's actual color
    // comes from the element's background-color, not from here. (The logo
    // paints through opaque per-path fills instead, which need no help.)
    const flat = source.svg
        .replace(/\s+/g, ' ')
        .replace(/ class="[^"]*"/g, '')
        .replace(TABLER_BACKGROUND_PATH, '')
        .replace(/currentColor/g, '#000')
        .trim()

    if (!source.crop) return flat

    // The intrinsic width/height are cropped along with the viewBox, because
    // mask-size takes its aspect ratio from those attributes and not from the
    // viewBox. Only the first match is rewritten — the <svg> element's own.
    const [x, y, w, h] = source.crop
    return flat
        .replace(/ width="[^"]*"/, ` width="${w}"`)
        .replace(/ height="[^"]*"/, ` height="${h}"`)
        .replace(/ viewBox="[^"]*"/, ` viewBox="${x} ${y} ${w} ${h}"`)
}

function maskUrl(svg: string): string {
    // encodeURIComponent escapes the quotes and '#' that would otherwise end
    // the url() token early, so the result is safe to wrap in double quotes.
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

let stylesInstalled = false

/**
 * Adds one stylesheet carrying every glyph's mask-image. Called from
 * Output.init rather than run as an import side effect, so nothing is injected
 * into documents that never show a panel.
 */
export function installOutputGlyphStyles() {
    if (stylesInstalled) return
    stylesInstalled = true

    // The URI goes into a custom property and is referenced twice, rather than
    // written out for both the prefixed and unprefixed property — at a hundred
    // glyphs that halves the size of the sheet this puts in the document.
    const rules = GLYPH_KEYS.map((key) => {
        const url = maskUrl(prepare(GLYPHS[key]))
        return `.output-glyph--${key}{--output-glyph-mask:${url};`
            + `-webkit-mask-image:var(--output-glyph-mask);mask-image:var(--output-glyph-mask)}`
    })

    const style = document.createElement('style')
    style.id = 'output-glyph-masks'
    style.textContent = rules.join('\n')
    document.head.appendChild(style)
}
