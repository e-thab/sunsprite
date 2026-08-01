// Built-in game assets live in public/ (loaded by Phaser at runtime via a
// literal URL string, e.g. Sprite's `src`), unlike src/assets/images (editor
// chrome icons bundled through Vite). public/ isn't part of Vite's module
// graph, so there's no way to glob it at build time — these lists are
// hand-kept in sync with public/images/*. Shared by FileTree.vue (guest
// sandbox) and AssetLibrary.vue (project mode) so both show the same real
// assets instead of two hand-maintained copies drifting apart.

export function imagePath(category: string, fileName: string): string {
	return `/images/${category}/${fileName}`
}

export const animalFiles = [
	'elephant.png',
	'giraffe.png',
	'hippo.png',
	'monkey.png',
	'panda.png',
	'parrot.png',
	'penguin.png',
	'pig.png',
	'rabbit.png',
	'snake.png',
]

export const cardFiles = [
	'back.png',
	'clubs_02.png',
	'clubs_03.png',
	'clubs_04.png',
	'clubs_05.png',
	'clubs_06.png',
	'clubs_07.png',
	'clubs_08.png',
	'clubs_09.png',
	'clubs_10.png',
	'clubs_A.png',
	'clubs_J.png',
	'clubs_K.png',
	'clubs_Q.png',
	'diamonds_02.png',
	'diamonds_03.png',
	'diamonds_04.png',
	'diamonds_05.png',
	'diamonds_06.png',
	'diamonds_07.png',
	'diamonds_08.png',
	'diamonds_09.png',
	'diamonds_10.png',
	'diamonds_A.png',
	'diamonds_J.png',
	'diamonds_K.png',
	'diamonds_Q.png',
	'empty.png',
	'hearts_02.png',
	'hearts_03.png',
	'hearts_04.png',
	'hearts_05.png',
	'hearts_06.png',
	'hearts_07.png',
	'hearts_08.png',
	'hearts_09.png',
	'hearts_10.png',
	'hearts_A.png',
	'hearts_J.png',
	'hearts_K.png',
	'hearts_Q.png',
	'joker_black.png',
	'joker_red.png',
	'spades_02.png',
	'spades_03.png',
	'spades_04.png',
	'spades_05.png',
	'spades_06.png',
	'spades_07.png',
	'spades_08.png',
	'spades_09.png',
	'spades_10.png',
	'spades_A.png',
	'spades_J.png',
	'spades_K.png',
	'spades_Q.png',
]
