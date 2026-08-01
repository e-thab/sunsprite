// Kid-friendly word lists for generating short, memorable project URLs
// (e.g. "sparkly-brave-otter"), Gfycat-style.

export const adjectives = [
  'sparkly', 'brave', 'silly', 'quick', 'jolly', 'mighty', 'gentle', 'clever',
  'bouncy', 'cozy', 'daring', 'eager', 'fuzzy', 'giggly', 'happy', 'icy',
  'jumpy', 'kind', 'lucky', 'merry', 'nifty', 'orange', 'plucky', 'quiet',
  'rosy', 'shiny', 'tiny', 'upbeat', 'vivid', 'witty', 'zesty', 'zippy',
  'bold', 'breezy', 'chipper', 'dazzling', 'electric', 'fluffy', 'glowing',
  'humble', 'itty', 'jazzy', 'keen', 'lively', 'mellow', 'nimble', 'peppy',
  'proud', 'quirky', 'radiant', 'snappy', 'spry', 'twinkly', 'vibrant',
  'wobbly', 'yummy', 'zany', 'amber', 'bubbly', 'crafty', 'dreamy',
  'energetic', 'fancy', 'goofy', 'honest', 'inky', 'jubilant', 'kooky',
  'loud', 'magic', 'noble', 'odd', 'perky', 'quaint', 'royal', 'speedy',
  'trusty', 'unique', 'velvety', 'warm', 'young', 'zealous', 'ancient',
  'cheerful', 'dandy', 'epic', 'frosty', 'grand', 'hazy', 'invincible',
  'jagged', 'lofty', 'misty', 'neat', 'polka', 'quick-witted', 'rapid',
  'stellar', 'turbo', 'ultra', 'wild', 'yellow', 'zigzag',
]

export const nouns = [
  'otter', 'fox', 'panda', 'tiger', 'eagle', 'rabbit', 'dolphin', 'koala',
  'penguin', 'falcon', 'wolf', 'lion', 'turtle', 'owl', 'lynx', 'moose',
  'raccoon', 'badger', 'heron', 'gecko', 'sparrow', 'beetle', 'firefly',
  'comet', 'meteor', 'rocket', 'robot', 'wizard', 'dragon', 'phoenix',
  'unicorn', 'griffin', 'pirate', 'ninja', 'knight', 'explorer', 'astronaut',
  'inventor', 'painter', 'juggler', 'acrobat', 'dreamer', 'wanderer',
  'puzzle', 'lantern', 'compass', 'meadow', 'canyon', 'glacier', 'volcano',
  'rainbow', 'thunder', 'breeze', 'pebble', 'seashell', 'cactus', 'bramble',
  'chestnut', 'maple',
]

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!
}

export function generateSlug(): string {
  const first = pick(adjectives)
  let second = pick(adjectives)
  while (second === first) second = pick(adjectives)

  return `${first}-${second}-${pick(nouns)}`
}
