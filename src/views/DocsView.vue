<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DropdownMenuItem } from '@nuxt/ui'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'
import { docsDataKey } from '@/assets/docs/docsData'
import { useDocsData } from '@/assets/docs/docsVersions'
import { provideDocsToc } from '@/assets/docs/docsToc'
import { apiVersionDropdownItems, defaultApiVersion } from '@/assets/api/versions'
import DocsTree from '@/components/docs/DocsTree.vue'
import DocsBreadcrumb from '@/components/docs/DocsBreadcrumb.vue'
import DocsCategoryLanding from '@/components/docs/DocsCategoryLanding.vue'
import DocsBody from '@/components/docs/DocsBody.vue'
import DocsToc from '@/components/docs/DocsToc.vue'
import ErrorView from './ErrorView.vue'

const route = useRoute()
const router = useRouter()

// This route has no project of its own (reached directly at /docs, outside
// the editor), so unlike DocsPanel.vue it can't just follow
// apiVersionStore — it gets its own selector instead (see the dropdown in
// the template below), local and session-only, exactly like CodeEditor.vue's
// own dropdown before project-persistence existed.
const selectedVersion = ref(defaultApiVersion())
const docsData = useDocsData(selectedVersion)
provide(docsDataKey, docsData)

// Same shared item-building CodeEditor.vue's own dropdown uses — no Monaco/
// sandbox side effects to run here, just swap which version useDocsData
// resolves; its own watcher (see docsVersions.ts) does the rest.
const versionItems = computed<DropdownMenuItem[][]>(() =>
	apiVersionDropdownItems(selectedVersion.value, (version) => { selectedVersion.value = version })
)

const routePath = computed(() => {
	const raw = route.params.pathMatch
	return Array.isArray(raw) ? raw.join('/') : (raw ?? '')
})

// router.push() below is async — actual navigation (route match, guards, the
// page's own re-render) can lag a click by several ms, which visibly showed
// as the clicked tree item's highlight briefly holding its hover color
// before snapping to the current-page one once the route caught up.
// optimisticPath tracks the just-clicked target so currentPath — and
// everything driven by it (tree highlight, page content, TOC) — updates the
// instant navigate() runs, with the real route/URL following shortly after
// in the background. Cleared once that push settles (resolved or rejected;
// .finally() covers both) — guarded on still being the same path in case a
// second click landed before the first's push settled, so that one's own
// clear doesn't stomp the second click's own still-pending state.
const optimisticPath = ref<string | null>(null)
const currentPath = computed(() => optimisticPath.value ?? routePath.value)

function navigate(path: string, opts?: { reveal?: boolean }) {
	optimisticPath.value = path
	router.push(`/docs/${path}`).finally(() => {
		if (optimisticPath.value === path) optimisticPath.value = null
	})
	if (opts?.reveal) {
		for (const entry of docsData.value.ancestorsOf(path)) expandOverrides.set(entry.path, true)
	}
}

function resolveHref(path: string) {
	return `/docs/${path}`
}

// Expand/collapse state, keyed by path — entirely persistent and
// user-controlled from here on: nothing ever *removes* a path once it's
// been decided, so navigating elsewhere can never make a category collapse.
// (An earlier version fell back to "is this path an ancestor of the current
// page" for anything untouched, which made navigation-driven auto-expand
// look right up until you navigated *away* — the ancestry check would then
// just as automatically go false again, reading as an unwanted collapse.)
const expandOverrides = reactive(new Map<string, boolean>())

function isExpanded(path: string): boolean {
	return expandOverrides.get(path) ?? false
}

function toggleExpanded(path: string) {
	expandOverrides.set(path, !isExpanded(path))
}

// Reveals where the current page lives the first time you arrive there —
// seeds each of its ancestors to expanded, but only ones with no explicit
// choice yet, so this never overrides something the user already decided
// (in either direction) for an unrelated or previously-visited branch.
// Also re-runs when docsData changes (a version switch) — see DocsPanel.vue's
// identical watcher for why.
watch([currentPath, docsData], ([path]) => {
	for (const entry of docsData.value.ancestorsOf(path)) {
		if (!expandOverrides.has(entry.path)) expandOverrides.set(entry.path, true)
	}
}, { immediate: true })

provide(docsNavigationKey, { currentPath, navigate, resolveHref, isExpanded, toggleExpanded })

const currentNode = computed(() => docsData.value.nodesByPath.get(currentPath.value))

// Filled in by the page itself as it mounts, so it changes a tick after
// currentPath does — which is why the TOC's own width is re-measured on
// tocSections rather than only on navigation.
const tocSections = provideDocsToc()

// The TOC is what gives first when the window gets tight: it drops out once the
// body column would be squeezed below this. In rem so it tracks the user's font
// size, same as the rail caps over in the style block.
const MIN_BODY_WIDTH = 32

const pageRef = ref<{ $el?: unknown } | null>(null)
const showToc = ref(true)

// The width the TOC occupied last time it was on screen. Once it's gone the
// grid has no way to tell us what putting it back would cost, and that's
// exactly what the test below needs.
let tocWidth = 0
let observer: ResizeObserver | undefined
let observed: HTMLElement | undefined

// UPage is a single-root component, but the v-if above means $el is a comment
// node on the 404 branch, so this is an element only when the page is really up.
function rootEl(): HTMLElement | null {
	const el = pageRef.value?.$el
	return el instanceof HTMLElement ? el : null
}

function measure() {
	const root = rootEl()
	if (!root) return

	// Both rails are queried out of the live DOM rather than held as template
	// refs. They're passed into UPage's slots, and reka-ui's Slot re-clones that
	// vnode on every render (deleting props.ref on the way through), so a ref on
	// slot content is dropped the first time the slot re-renders and never
	// restored — which is precisely what an on/off TOC does to it.
	const tree = root.querySelector<HTMLElement>(':scope > .docs-view-tree')
	if (!tree) return
	const toc = root.querySelector<HTMLElement>(':scope > .docs-toc')

	if (showToc.value) tocWidth = toc ? toc.offsetWidth : 0

	const styles = getComputedStyle(root)
	const gap = Number.parseFloat(styles.columnGap) || 0
	const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

	// Always the width the body *would* have with the TOC present — container
	// less the tree, both gaps and the TOC itself — so the answer never depends
	// on whether the TOC happens to be showing right now. Testing the width it
	// currently has would oscillate instead: hiding the TOC widens the body back
	// past the threshold, which brings the TOC back, which narrows the body
	// below it again.
	const bodyWithToc = root.clientWidth - tree.offsetWidth - gap * 2 - tocWidth
	showToc.value = bodyWithToc >= MIN_BODY_WIDTH * rem
}

// Only the grid container is observed, and only ever re-pointed at a genuinely
// new element — never left disconnected on the way past, which is how an
// earlier version got stuck with the TOC hidden and nothing listening.
function observeRoot() {
	const root = rootEl()
	if (!root || root === observed) return
	observer ??= new ResizeObserver(measure)
	if (observed) observer.unobserve(observed)
	observer.observe(root)
	observed = root
}

function update() {
	observeRoot()
	measure()
}

onMounted(update)
// The root's own resizes come from the observer. These cover what moves the
// boundary without resizing it: expanding or collapsing a branch widens the
// tree's fit-content track, and the TOC's own contents change (a tick after
// navigation, once the new page has mounted and registered its sections).
watch(expandOverrides, measure, { flush: 'post' })
watch(currentPath, update, { flush: 'post' })
watch(tocSections, measure, { flush: 'post' })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
	<ErrorView
		v-if="!currentNode"
		:status-code="404"
		status-message="Doc not found"
		message="There's no documentation page at this address."
		back-label="Back to docs"
		back-to="/docs"
	/>

	<UPage v-else ref="pageRef" class="docs-view">
		<template #left>
			<div class="docs-view-tree">
				<DocsTree :nodes="docsData.tree" />
			</div>
		</template>

		<div class="breadcrumb-container">
			<DocsBreadcrumb />
			<UFieldGroup class="docs-version-picker">
				<UBadge class="version-badge" color="primary" variant="subtle" size="xs" style="font-size: small;">&nbsp;Version {{ selectedVersion }}&nbsp;</UBadge>
				<UDropdownMenu :items="versionItems">
					<UButton color="primary" variant="subtle" icon="tabler:chevron-down" size="xs" />
				</UDropdownMenu>
			</UFieldGroup>
		</div>

		<UPageBody>
			<UContainer class="docs-view-container">
				<DocsCategoryLanding v-if="currentNode.kind === 'category'" :node="currentNode" />
				<DocsBody v-else :node="currentNode" />
			</UContainer>
		</UPageBody>

		<template #right>
			<DocsToc v-if="showToc" :sections="tocSections" />
		</template>
	</UPage>
</template>

<style scoped>
.docs-view {
	height: 100%;
	overflow-y: auto;
	background-color: var(--theme-bg-elevated);

	/* Ceilings, not widths — see the tracks below. Past these the rails stop
	   growing and their labels go back to truncating, so one deep branch or long
	   title can't run away with the page. */
	--docs-tree-max-width: 18rem;
	--docs-toc-max-width: 8rem;

	/* Owns the page layout outright, replacing @nuxt/ui's page theme, which only
	   switches its 10-column grid on at lg (1024px) and stacks the tree, body and
	   TOC into one column below that.

	   fit-content(<max>) sizes each rail to its own widest line — the deepest
	   currently-expanded tree row, the longest TOC entry — and clamps it there.
	   Track sizing is redone on every layout, so expanding or collapsing a branch
	   resizes the tree column by itself; nothing measures or observes anything.
	   The body takes what's left, via minmax(0, 1fr) rather than a bare 1fr so a
	   wide code block scrolls inside it instead of stretching the track. All
	   three tracks stay declared even when the TOC is hidden: the empty rail
	   collapses to nothing on its own and the gap it leaves behind is what keeps
	   the body off the right edge of the window.
	   (Scoped styles are unlayered, so they beat the theme's @layer utilities
	   classes on this element regardless of specificity.) */
	display: grid;
	grid-template-columns:
		var(--docs-tree-max-width) /* Don't fit to content, force to max-width */
		minmax(0, 1fr)
		fit-content(var(--docs-toc-max-width));
	gap: 2.5rem;
}

/* Each region is one track now, so the theme's col-span-* (sized for its own
   10-column grid) and its order-first/order-last dance both have to go —
   without the order reset the TOC jumps to the leftmost track below lg. */
.docs-view > :deep(*) {
	grid-column: auto;
	order: 0;
	min-width: 0;
}

.breadcrumb-container {
	display: flex;
	justify-content: space-between;
	max-width: 96rem;
	/* padding-block: 1.5em; */
	padding: 0.5em 1.5em 0 1.5em;
	/* justify-self: center; */
}

.docs-version-picker {
	margin: 0 0.5em 0 0;
}

.version-badge {
	padding-left: 0.4em;
	padding-right: 0.4em;
	border-top-left-radius: var(--panel-border-radius);
	border-bottom-left-radius: var(--panel-border-radius);
}

.docs-view-tree {
	padding: 1em 0.5em;
	position: sticky;
	top: 0;
	/* Bounds the sticky tree to the visible viewport below NavBar, so a long
	   tree scrolls internally instead of growing past the fold. --nav-height
	   is NavBar's real measured height (see NavBar.vue), not an estimate. */
	max-height: calc(100vh - var(--nav-height));
	overflow-y: auto;
	/* Reserves the scrollbar's width up front so it's part of what the column
	   measures, instead of landing on top of the longest label once the tree
	   grows past the fold. */
	scrollbar-gutter: stable;
}

.docs-view-container {
	max-width: 96rem;
	padding-block: 1.5em;
}
</style>
