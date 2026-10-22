# phaser@4.1.0.patch: WebGL outline notches on rounded rectangles

This patch fixes one line in Phaser's WebGL shape outline code. That line is why outlined rounded rectangles get small notches on the outside of three of their corners. The canvas renderer doesn't have the problem.

pnpm applies the patch on every install. The setting is `patchedDependencies` in `pnpm-workspace.yaml`.

## Symptom

- Renderer: WebGL only. Canvas outlines look right.
- Shape: a `Rectangle` with rounded corners (`cornerRadius > 0`) and an outline wider than 2px.
- What you see: a small gap on the outside of the curve at the top-right, bottom-right and bottom-left corners. The top-left corner is fine.

## How Phaser draws outlines in WebGL

Phaser doesn't stroke the outline path as one line. `StrokePathWebGL.js` turns the shape's `pathData` into a list of points. The `StrokePath` render node then draws each pair of neighbouring points as its own quad. When the line is wider than 2px, it also draws a small "connecting quad" at each joint to fill the wedge between two segments.

Each quad's corners come from the segment's direction, which `DrawLine.js` works out by dividing by the segment's length:

```js
// renderer/webgl/renderNodes/DrawLine.js
var len = Math.sqrt(dx * dx + dy * dy);

// A well-formed path has no zero length segments, so we don't check.

var al0 = aLineWidth * (by - ay) / len;
```

If two points are identical, the segment has zero length and the result is `0 / 0 = NaN`. The GPU discards triangles with `NaN` corners. That removes the segment's quad and both connecting quads next to it, so the joint has nothing filling its outside.

## Where duplicate points come from

`Rectangle.updateRoundedData` builds the rounded outline as four corner arcs joined by straight edges. Each edge ends at the point where the next arc begins, and `arcTo` adds that arc-start point again:

```js
// gameobjects/shape/rectangle/Rectangle.js
//  Top edge and top-right corner
path.push(x + halfWidth - radius, y - halfHeight);          // edge end...

this.arcTo(path, x + halfWidth - radius, y - halfHeight + radius,
    radius, Math.PI * 1.5, Math.PI * 2, segments);           // ...is this arc's first point
```

That gives one duplicate where each edge meets the top-right, bottom-right and bottom-left arcs: three duplicates in total. The top-left arc is where the path starts, so nothing comes before it to be duplicated. The path's final point does match its first point, but `StrokePath` closes the loop with a connecting quad, not a segment, so no zero-length segment is drawn there. This is why exactly three corners are notched.

## The bug: the duplicate check never matches

`StrokePathWebGL` already tries to skip duplicate points. But it compares two points in different coordinates:

```js
// gameobjects/shape/StrokePathWebGL.js (4.1.0)
var x = path[i] - dx;        // shifted by the display origin
var y = path[i + 1] - dy;
if (i > 0)
{
    if (x === path[i - 2] && y === path[i - 1])   // previous point, NOT shifted
    {
        // Duplicate point, skip it
        continue;
    }
}
```

`dx` and `dy` are the shape's display origin, which is half its width and height for a centred shape. All our shapes are centred, so the shift is never zero. The current point is shifted and the previous one isn't, so the comparison is never true. The duplicates are kept, and each one becomes a zero-length segment.

## The fix

Compare both points in the same coordinates:

```js
if (x === path[i - 2] - dx && y === path[i - 1] - dy)
```

Both sides now go through the same subtraction, so a true duplicate gives exactly equal numbers and gets skipped. No zero-length segments are left, and every joint gets its connecting quad.

The patch changes this line in three files:

| File | Why it's patched |
| ---- | ---------------- |
| `dist/phaser.esm.js` | What the app actually runs. `exports["."].import` points here, so Vite bundles it. |
| `dist/phaser.js` | The `require` entry. Patched for consistency. |
| `src/gameobjects/shape/StrokePathWebGL.js` | The readable source, so the code you see matches what runs. |

The minified builds (`phaser.min.js`, `phaser.esm.min.js`) are not patched. Each one is a single line, so changing them copies the whole file (about 5 MB) into the patch, and nothing here imports them.

## Upstream: issue #7361 and PR #7362

[phaserjs/phaser#7361](https://github.com/phaserjs/phaser/issues/7361) reports a bug in the same line, with the opposite effect. That issue is about a polygon losing a real corner. Our issue is a notch from a duplicate point that should have been skipped.

- **#7361: the check matches when it shouldn't.** A centred diamond has one corner whose shifted position equals the previous corner's unshifted position. The check treats it as a duplicate and drops a real corner, so the outline cuts across the shape. A forum thread linked from the issue shows the same thing on a rectangle with `setOrigin(1, 0)`.
- **Our case: the check doesn't match when it should.** The rounded rectangle's true duplicates are never skipped.

Both come from mixing shifted and unshifted coordinates, and comparing in the same coordinates fixes both. [PR #7362](https://github.com/phaserjs/phaser/pull/7362), "Fix polygon stroke vertex deduplication", does exactly that. Its tests cover "consecutive duplicate vertices with zero and non-zero display origins", which is our case. As of 2026-10-22, the issue and the PR are both open and unmerged. The issue reports the bug in 4.2.1, so upgrading Phaser won't fix it yet.

**When to remove this patch:** when we upgrade to a Phaser release that includes #7362. At that point, delete this file, `phaser@4.1.0.patch`, and the `patchedDependencies` entry in `pnpm-workspace.yaml`. When the version changes, pnpm will also refuse to install until the patch entry is updated or removed.

## Not fixed: outline alpha stacking

With `outlineAlpha < 1`, the outline looks darker where pieces overlap, at every joint. That comes from the same quad-per-segment approach: each segment quad and each connecting quad is blended separately, so overlapping areas get the alpha applied twice. This patch doesn't change that, and it affects circles too, since an arc is many short segments.

Fixing it would mean drawing the outline as a single filled ring, so no pixel is covered twice. The ring is the area between an outer outline offset by `+lineWidth / 2` and an inner one offset by `-lineWidth / 2`, triangulated with `Phaser.Geom.Polygon.Earcut` using its holes support. A shape has only one fill colour, so this would be a second Phaser object kept in sync with the shape.

## Checking it works

With the WebGL renderer, draw a rectangle with `cornerRadius: 20, outlineWidth: 10`. Zoom in on the outside of the top-right, bottom-right and bottom-left corners. The notches that were there before the patch should be gone, and the outline should match the canvas renderer's apart from the alpha stacking above.
