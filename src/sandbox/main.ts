import { watch } from 'vue'

import {
	game, mouseRef, pausedRef, runUserCode, resizeStage,
	pause, play, handleKeyDown, handleKeyUp, releaseAllKeys,
} from '@/assets/api/core'
import type { ParentToSandboxMessage, SandboxToParentMessage } from '@/assets/api/sandboxProtocol'

function postToParent(message: SandboxToParentMessage) {
	window.parent.postMessage(message, '*')
}

window.addEventListener('message', (event: MessageEvent<ParentToSandboxMessage>) => {
	// Only accept commands from the page that embedded us
	if (event.source !== window.parent) return

	const message = event.data
	switch (message.type) {
		case 'sunsprite:run':
			runUserCode(message.code)
			break
		case 'sunsprite:play':
			play()
			break
		case 'sunsprite:pause':
			pause()
			break
		case 'sunsprite:keydown':
			handleKeyDown(message.code)
			break
		case 'sunsprite:keyup':
			handleKeyUp(message.code)
			break
		case 'sunsprite:blur':
		case 'sunsprite:contextmenu':
			releaseAllKeys()
			break
	}
})

// Prevent right click opening the context menu over the game canvas
const gameContainer = document.getElementById('game-container')
gameContainer?.addEventListener('contextmenu', event => {
	event.preventDefault()
})

// Forward mouse position and pause state changes out to the parent, which no longer has
// direct access to these live bindings now that core.ts runs inside this frame.
watch(mouseRef, value => {
	postToParent({ type: 'sunsprite:mouse', x: value.mouseX, y: value.mouseY })
}, { deep: true })

watch(pausedRef, value => {
	postToParent({ type: 'sunsprite:paused', paused: value })
})

// FPS reporting (previously read directly off `game` by PhaserCanvas.vue, which can no
// longer reach into this frame's `game` instance)
window.setInterval(() => {
	if (!game) return
	postToParent({ type: 'sunsprite:fps', fps: Math.round(game.loop.actualFps) })
}, 250)

if (gameContainer) {
	// `game` doesn't exist until the parent sends a 'run' message, which the observer may
	// fire before (ResizeObserver reports once shortly after observe() is called).
	new ResizeObserver(() => { if (game) resizeStage() }).observe(gameContainer)
}

postToParent({ type: 'sunsprite:ready' })
