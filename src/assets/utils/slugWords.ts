// Accessible word lists for generating short, memorable project URLs
// (e.g. "sparkly-brave-otter"), Gfycat-style.

// Each URL has two descriptor words followed by a noun. Each descriptor
// has to honor the ordering heuristic:
//    
//    Adverb OR ordinal
//    Opinion (lovely, ugly, terrible)
//    Size
//    Age
//    Shape (curly, round)
//    Color
//    Origin (french, cuban) - currently unused
//    Material (wood, metal)
//
// in order to avoid (most) awkward-sounding slugs like blue-new-pebble
// or categorically confusing ones like green-purple-fox

export const adverbsAndOrdinals = [
  // Adverbs
  'very', 'fully', 'almost', 'rather', 'too', 'fairly', 'barely', 'often',
  'always', 'ultra', 'truly', 'half', 'ideally', 'actually', 'entirely',
  'highly', 'super', 'hardly', 'newly', 'mostly', 'locally', 'nearly',
  'partly', 'plainly', 'politely', 'really', 'seldom', 'simply', 'slightly',
  'strictly',  'surely', 'suddenly', 'sometimes', 'strangely', 'suitably',
  'awfully', 'not',

  // Ordinals
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
  'ninth', 'tenth', 'last'
]

export const opinionAdjectives = [
  'sparkly', 'brave', 'silly', 'quick', 'jolly', 'gentle', 'clever', 'bouncy',
  'cozy', 'daring', 'eager', 'funny', 'happy', 'jumpy', 'kind', 'lucky',
  'merry', 'nifty', 'plucky', 'quiet', 'shiny', 'upbeat', 'vivid', 'witty',
  'zippy', 'bold', 'breezy', 'chipper', 'dazzling', 'electric', 'glowing',
  'humble', 'keen', 'lively', 'mellow', 'nimble', 'peppy', 'proud', 'quirky',
  'radiant', 'snappy', 'spry', 'twinkly', 'vibrant', 'zany', 'crafty',
  'energetic', 'fancy', 'goofy', 'honest', 'kooky', 'loud', 'magical',
  'noble', 'odd', 'quaint', 'royal', 'speedy', 'trusty', 'unique', 'zealous',
  'cheerful', 'dandy', 'epic', 'invincible', 'neat', 'rapid', 'stellar',
  'turbo', 'wild', 'calm',
]

export const sizeAdjectives = [
  'tiny', 'mighty', 'grand', 'lofty',
]

export const ageAdjectives = [
  'young', 'ancient', 'new',
]

export const shapeAdjectives = [
  'jagged', 'wobbly',
]

export const colorAdjectives = [
  'rosy', 'amber', 'red', 'orange', 'yellow', 'blue', 'green', 'indigo',
  'violet', 'purple',
]

export const materialAdjectives = [
  'fuzzy', 'icy', 'fluffy', 'bubbly', 'carbonated', 'frosty', 'hazy', 'misty',
]

// Hierarchy tiers, ordered to match the comment above (origin is unused).
const descriptor_hierarchy = [
  adverbsAndOrdinals,
  opinionAdjectives,
  sizeAdjectives,
  ageAdjectives,
  shapeAdjectives,
  colorAdjectives,
  materialAdjectives,
] as const

export const nouns = [
  'otter', 'fox', 'panda', 'tiger', 'eagle', 'rabbit', 'dolphin', 'koala',
  'penguin', 'falcon', 'wolf', 'lion', 'turtle', 'owl', 'lynx', 'moose',
  'raccoon', 'badger', 'heron', 'gecko', 'sparrow', 'beetle', 'firefly',
  'comet', 'meteor', 'rocket', 'robot', 'wizard', 'dragon', 'phoenix',
  'unicorn', 'griffin', 'pirate', 'ninja', 'knight', 'explorer', 'astronaut',
  'inventor', 'painter', 'juggler', 'acrobat', 'dreamer', 'wanderer',
  'puzzle', 'lantern', 'compass', 'meadow', 'canyon', 'glacier', 'volcano',
  'rainbow', 'thunder', 'breeze', 'pebble', 'seashell', 'cactus', 'bramble',
  'tree', 'walrus',
]

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!
}

export function generateSlug(): string {
  const tierCount = descriptor_hierarchy.length
  const firstTier = Math.floor(Math.random() * tierCount)
  let secondTier = Math.floor(Math.random() * tierCount)
  while (secondTier === firstTier) secondTier = Math.floor(Math.random() * tierCount)

  const [earlierTier, laterTier] =
    firstTier < secondTier ? [firstTier, secondTier] : [secondTier, firstTier]

  const first = pick(descriptor_hierarchy[earlierTier]!)
  const second = pick(descriptor_hierarchy[laterTier]!)

  return `${first}-${second}-${pick(nouns)}`
}

for (let i=0; i<10; i++) {
  console.log(generateSlug())
}
