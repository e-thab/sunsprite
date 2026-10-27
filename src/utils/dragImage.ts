// The browser's own drag image is just the row that was grabbed, which
// undersells a drag carrying several — used by FileTree.vue and
// AssetLibrary.vue when more than one selected row goes along. Briefly in the
// DOM only because setDragImage needs a rendered element to snapshot.
export function setCountDragImage(dataTransfer: DataTransfer, count: number) {
	const ghost = document.createElement('div')
	ghost.textContent = `${count} files`
	Object.assign(ghost.style, {
		position: 'fixed',
		top: '-1000px',
		left: '0',
		padding: '0.2em 0.6em',
		borderRadius: '0.4em',
		font: '12px sans-serif',
		color: 'var(--theme-text-highlighted)',
		background: 'var(--theme-bg-accented)',
		border: '1px solid var(--theme-primary)',
	})
	document.body.appendChild(ghost)
	dataTransfer.setDragImage(ghost, -12, -12)
	setTimeout(() => ghost.remove())
}
