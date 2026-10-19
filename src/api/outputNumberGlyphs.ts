// @tabler/icons' full number-0-small … number-99-small set, imported as raw
// SVG. Kept in its own module purely to quarantine a hundred import lines away
// from the glyph logic in outputGlyphs.ts.
//
// A repeat count is one icon rather than two single digits butted together,
// because tabler kerns each pair by hand: number-11-small pulls its second "1"
// in to x14 instead of sitting it on the x16 cell centre that a composed pair
// would use. Over the wire this costs almost nothing — the hundred icons share
// so much boilerplate that they gzip to a little over a kilobyte.
//
// Indexed by the number itself, so NUMBER_SVGS[47] is number-47-small. 0 and 1
// are never shown (a repeat count only ever starts at 2) but are kept so that
// the index and the count stay the same thing.

import n0 from '@tabler/icons/outline/number-0-small.svg?raw'
import n1 from '@tabler/icons/outline/number-1-small.svg?raw'
import n2 from '@tabler/icons/outline/number-2-small.svg?raw'
import n3 from '@tabler/icons/outline/number-3-small.svg?raw'
import n4 from '@tabler/icons/outline/number-4-small.svg?raw'
import n5 from '@tabler/icons/outline/number-5-small.svg?raw'
import n6 from '@tabler/icons/outline/number-6-small.svg?raw'
import n7 from '@tabler/icons/outline/number-7-small.svg?raw'
import n8 from '@tabler/icons/outline/number-8-small.svg?raw'
import n9 from '@tabler/icons/outline/number-9-small.svg?raw'
import n10 from '@tabler/icons/outline/number-10-small.svg?raw'
import n11 from '@tabler/icons/outline/number-11-small.svg?raw'
import n12 from '@tabler/icons/outline/number-12-small.svg?raw'
import n13 from '@tabler/icons/outline/number-13-small.svg?raw'
import n14 from '@tabler/icons/outline/number-14-small.svg?raw'
import n15 from '@tabler/icons/outline/number-15-small.svg?raw'
import n16 from '@tabler/icons/outline/number-16-small.svg?raw'
import n17 from '@tabler/icons/outline/number-17-small.svg?raw'
import n18 from '@tabler/icons/outline/number-18-small.svg?raw'
import n19 from '@tabler/icons/outline/number-19-small.svg?raw'
import n20 from '@tabler/icons/outline/number-20-small.svg?raw'
import n21 from '@tabler/icons/outline/number-21-small.svg?raw'
import n22 from '@tabler/icons/outline/number-22-small.svg?raw'
import n23 from '@tabler/icons/outline/number-23-small.svg?raw'
import n24 from '@tabler/icons/outline/number-24-small.svg?raw'
import n25 from '@tabler/icons/outline/number-25-small.svg?raw'
import n26 from '@tabler/icons/outline/number-26-small.svg?raw'
import n27 from '@tabler/icons/outline/number-27-small.svg?raw'
import n28 from '@tabler/icons/outline/number-28-small.svg?raw'
import n29 from '@tabler/icons/outline/number-29-small.svg?raw'
import n30 from '@tabler/icons/outline/number-30-small.svg?raw'
import n31 from '@tabler/icons/outline/number-31-small.svg?raw'
import n32 from '@tabler/icons/outline/number-32-small.svg?raw'
import n33 from '@tabler/icons/outline/number-33-small.svg?raw'
import n34 from '@tabler/icons/outline/number-34-small.svg?raw'
import n35 from '@tabler/icons/outline/number-35-small.svg?raw'
import n36 from '@tabler/icons/outline/number-36-small.svg?raw'
import n37 from '@tabler/icons/outline/number-37-small.svg?raw'
import n38 from '@tabler/icons/outline/number-38-small.svg?raw'
import n39 from '@tabler/icons/outline/number-39-small.svg?raw'
import n40 from '@tabler/icons/outline/number-40-small.svg?raw'
import n41 from '@tabler/icons/outline/number-41-small.svg?raw'
import n42 from '@tabler/icons/outline/number-42-small.svg?raw'
import n43 from '@tabler/icons/outline/number-43-small.svg?raw'
import n44 from '@tabler/icons/outline/number-44-small.svg?raw'
import n45 from '@tabler/icons/outline/number-45-small.svg?raw'
import n46 from '@tabler/icons/outline/number-46-small.svg?raw'
import n47 from '@tabler/icons/outline/number-47-small.svg?raw'
import n48 from '@tabler/icons/outline/number-48-small.svg?raw'
import n49 from '@tabler/icons/outline/number-49-small.svg?raw'
import n50 from '@tabler/icons/outline/number-50-small.svg?raw'
import n51 from '@tabler/icons/outline/number-51-small.svg?raw'
import n52 from '@tabler/icons/outline/number-52-small.svg?raw'
import n53 from '@tabler/icons/outline/number-53-small.svg?raw'
import n54 from '@tabler/icons/outline/number-54-small.svg?raw'
import n55 from '@tabler/icons/outline/number-55-small.svg?raw'
import n56 from '@tabler/icons/outline/number-56-small.svg?raw'
import n57 from '@tabler/icons/outline/number-57-small.svg?raw'
import n58 from '@tabler/icons/outline/number-58-small.svg?raw'
import n59 from '@tabler/icons/outline/number-59-small.svg?raw'
import n60 from '@tabler/icons/outline/number-60-small.svg?raw'
import n61 from '@tabler/icons/outline/number-61-small.svg?raw'
import n62 from '@tabler/icons/outline/number-62-small.svg?raw'
import n63 from '@tabler/icons/outline/number-63-small.svg?raw'
import n64 from '@tabler/icons/outline/number-64-small.svg?raw'
import n65 from '@tabler/icons/outline/number-65-small.svg?raw'
import n66 from '@tabler/icons/outline/number-66-small.svg?raw'
import n67 from '@tabler/icons/outline/number-67-small.svg?raw'
import n68 from '@tabler/icons/outline/number-68-small.svg?raw'
import n69 from '@tabler/icons/outline/number-69-small.svg?raw'
import n70 from '@tabler/icons/outline/number-70-small.svg?raw'
import n71 from '@tabler/icons/outline/number-71-small.svg?raw'
import n72 from '@tabler/icons/outline/number-72-small.svg?raw'
import n73 from '@tabler/icons/outline/number-73-small.svg?raw'
import n74 from '@tabler/icons/outline/number-74-small.svg?raw'
import n75 from '@tabler/icons/outline/number-75-small.svg?raw'
import n76 from '@tabler/icons/outline/number-76-small.svg?raw'
import n77 from '@tabler/icons/outline/number-77-small.svg?raw'
import n78 from '@tabler/icons/outline/number-78-small.svg?raw'
import n79 from '@tabler/icons/outline/number-79-small.svg?raw'
import n80 from '@tabler/icons/outline/number-80-small.svg?raw'
import n81 from '@tabler/icons/outline/number-81-small.svg?raw'
import n82 from '@tabler/icons/outline/number-82-small.svg?raw'
import n83 from '@tabler/icons/outline/number-83-small.svg?raw'
import n84 from '@tabler/icons/outline/number-84-small.svg?raw'
import n85 from '@tabler/icons/outline/number-85-small.svg?raw'
import n86 from '@tabler/icons/outline/number-86-small.svg?raw'
import n87 from '@tabler/icons/outline/number-87-small.svg?raw'
import n88 from '@tabler/icons/outline/number-88-small.svg?raw'
import n89 from '@tabler/icons/outline/number-89-small.svg?raw'
import n90 from '@tabler/icons/outline/number-90-small.svg?raw'
import n91 from '@tabler/icons/outline/number-91-small.svg?raw'
import n92 from '@tabler/icons/outline/number-92-small.svg?raw'
import n93 from '@tabler/icons/outline/number-93-small.svg?raw'
import n94 from '@tabler/icons/outline/number-94-small.svg?raw'
import n95 from '@tabler/icons/outline/number-95-small.svg?raw'
import n96 from '@tabler/icons/outline/number-96-small.svg?raw'
import n97 from '@tabler/icons/outline/number-97-small.svg?raw'
import n98 from '@tabler/icons/outline/number-98-small.svg?raw'
import n99 from '@tabler/icons/outline/number-99-small.svg?raw'

export const NUMBER_SVGS: readonly string[] = [
    n0, n1, n2, n3, n4, n5, n6, n7, n8, n9,
    n10, n11, n12, n13, n14, n15, n16, n17, n18, n19,
    n20, n21, n22, n23, n24, n25, n26, n27, n28, n29,
    n30, n31, n32, n33, n34, n35, n36, n37, n38, n39,
    n40, n41, n42, n43, n44, n45, n46, n47, n48, n49,
    n50, n51, n52, n53, n54, n55, n56, n57, n58, n59,
    n60, n61, n62, n63, n64, n65, n66, n67, n68, n69,
    n70, n71, n72, n73, n74, n75, n76, n77, n78, n79,
    n80, n81, n82, n83, n84, n85, n86, n87, n88, n89,
    n90, n91, n92, n93, n94, n95, n96, n97, n98, n99,
]

/** Every whole-number glyph key, as a closed union. */
export type NumberGlyphKey =
    'n0' | 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'n6' | 'n7' |
    'n8' | 'n9' | 'n10' | 'n11' | 'n12' | 'n13' | 'n14' | 'n15' |
    'n16' | 'n17' | 'n18' | 'n19' | 'n20' | 'n21' | 'n22' | 'n23' |
    'n24' | 'n25' | 'n26' | 'n27' | 'n28' | 'n29' | 'n30' | 'n31' |
    'n32' | 'n33' | 'n34' | 'n35' | 'n36' | 'n37' | 'n38' | 'n39' |
    'n40' | 'n41' | 'n42' | 'n43' | 'n44' | 'n45' | 'n46' | 'n47' |
    'n48' | 'n49' | 'n50' | 'n51' | 'n52' | 'n53' | 'n54' | 'n55' |
    'n56' | 'n57' | 'n58' | 'n59' | 'n60' | 'n61' | 'n62' | 'n63' |
    'n64' | 'n65' | 'n66' | 'n67' | 'n68' | 'n69' | 'n70' | 'n71' |
    'n72' | 'n73' | 'n74' | 'n75' | 'n76' | 'n77' | 'n78' | 'n79' |
    'n80' | 'n81' | 'n82' | 'n83' | 'n84' | 'n85' | 'n86' | 'n87' |
    'n88' | 'n89' | 'n90' | 'n91' | 'n92' | 'n93' | 'n94' | 'n95' |
    'n96' | 'n97' | 'n98' | 'n99'
