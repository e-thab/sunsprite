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
	// A page picked out of the compact drawer is one you meant to *read*, so the
	// drawer gets out of the way of what you just chose (a no-op the rest of the
	// time — it's only ever open while compact). Categories are deliberately
	// left alone: clicking one in the tree expands it as well as navigating (see
	// DocsTree's onCategorySelect), so closing on those would shut the drawer
	// every time you opened a branch to look inside it.
	if (docsData.value.nodesByPath.get(path)?.kind === 'entry') treeOpen.value = false
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

// Below a certain width the tree stops being a rail and becomes an off-canvas
// drawer (see .docs-view-compact in the style block), reached from the
// hamburger in the breadcrumb row and overlaid on the page rather than taking
// a track of its own. Decided in measure() alongside showToc, off the same
// container width, so the two rails can never disagree about what's left over
// for the body between them.
const compact = ref(false)
const treeOpen = ref(false)

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

	// The TOC is queried out of the live DOM rather than held as a template ref.
	// It's passed into UPage's slots, and reka-ui's Slot re-clones that vnode on
	// every render (deleting props.ref on the way through), so a ref on slot
	// content is dropped the first time the slot re-renders and never restored —
	// which is precisely what an on/off TOC does to it.
	const toc = root.querySelector<HTMLElement>(':scope > .docs-toc')

	if (showToc.value) tocWidth = toc ? toc.offsetWidth : 0

	const styles = getComputedStyle(root)
	const gap = Number.parseFloat(styles.columnGap) || 0
	const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
	// The tree's track is a fixed size rather than fit-content (see the grid
	// below), so this var *is* its width — and, unlike measuring the element,
	// it still says what putting the tree back in the page would cost while it's
	// off canvas as a drawer. Authored in rem, same as the caps and floors here.
	const treeWidth = Number.parseFloat(styles.getPropertyValue('--docs-tree-max-width')) * rem

	// The two rails give way to the body in order: the TOC goes first, and only
	// once dropping it still isn't enough does the tree leave the layout too. So
	// this is the body's width with the TOC already gone but the tree still in
	// place — deliberately the full three-track layout whether or not we're
	// currently in it, for the same reason showToc measures the layout *with*
	// the TOC below: testing whatever the current state happens to give would
	// oscillate instead, since collapsing either rail widens the body back past
	// the very threshold that collapsed it.
	compact.value = root.clientWidth - treeWidth - gap * 2 < MIN_BODY_WIDTH * rem

	// Always the width the body *would* have with the TOC present — container
	// less whichever rails are in the layout, their gaps and the TOC itself — so
	// the answer never depends on whether the TOC happens to be showing right
	// now. Compact takes the tree's track out of the list entirely, one of the
	// two gaps with it (see .docs-view-compact). Both are zero today — the
	// columns carry their own gutters instead — but they're still counted here,
	// so these thresholds stay honest if the grid is ever given a gap back.
	const rails = compact.value ? gap : treeWidth + gap * 2
	showToc.value = root.clientWidth - rails - tocWidth >= MIN_BODY_WIDTH * rem
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

// "Open" is only meaningful while the tree is a drawer — without this it would
// stay latched from the last time the window was narrow and pop the tree back
// out as an overlay the moment it narrowed again.
watch(compact, (isCompact) => { if (!isCompact) treeOpen.value = false })

// The scrim below closes on click; this is the same escape hatch from the
// keyboard. Bound on window rather than the drawer itself so it works
// regardless of what currently holds focus.
function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') treeOpen.value = false
}

onMounted(() => {
	update()
	window.addEventListener('keydown', onKeydown)
})
// The root's own resizes come from the observer. These cover what moves the
// boundary without resizing it: expanding or collapsing a branch widens the
// tree's fit-content track, and the TOC's own contents change (a tick after
// navigation, once the new page has mounted and registered its sections).
watch(expandOverrides, measure, { flush: 'post' })
watch(currentPath, update, { flush: 'post' })
watch(tocSections, measure, { flush: 'post' })
onBeforeUnmount(() => {
	observer?.disconnect()
	window.removeEventListener('keydown', onKeydown)
})
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

	<UPage
		v-else
		ref="pageRef"
		class="docs-view"
		:class="{ 'docs-view-compact': compact, 'docs-view-tree-open': treeOpen }"
	>
		<template #left>
			<div class="docs-view-tree">
				<DocsTree :nodes="docsData.tree" />
			</div>
		</template>

		<!-- Sits in the default slot rather than beside the tree because UPage
		hands the left slot to reka-ui's Slot, which takes exactly one root
		element — and it's fixed-positioned, so being nested in the center
		column costs it nothing. -->
		<Transition name="scrim">
			<div v-if="compact && treeOpen" class="docs-view-scrim" @click="treeOpen = false"></div>
		</Transition>

		<div class="breadcrumb-container">
			<div class="breadcrumb-leading">
				<UButton
					v-if="compact"
					icon="tabler:menu-2"
					color="primary"
					variant="subtle"
					size="sm"
					aria-label="Toggle docs navigation"
					:aria-expanded="treeOpen"
					@click="treeOpen = !treeOpen"
				/>
				<DocsBreadcrumb />
			</div>
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
	   collapses to nothing on its own, and the body simply runs out to the
	   window's edge, where its own container's padding takes over.
	   (Scoped styles are unlayered, so they beat the theme's @layer utilities
	   classes on this element regardless of specificity.) */
	display: grid;
	grid-template-columns:
		var(--docs-tree-max-width) /* Don't fit to content, force to max-width */
		minmax(0, 1fr)
		fit-content(var(--docs-toc-max-width));
	/* No gutter of the grid's own: every column brings its own — the rails their
	   padding, the body its breadcrumb row's and UContainer's — which is also
	   what keeps the body off the window's right edge once the TOC's track
	   collapses to nothing, a job the trailing gap used to do.

	   Declared rather than simply left off, because off isn't neutral here:
	   @nuxt/ui's page theme puts lg:gap-10 (2.5rem) on this same element, so
	   with nothing of ours to beat it the grid would run gapless up to 1024px
	   and then jump. Scoped styles are unlayered, so this wins at every width
	   and that breakpoint stops existing for this grid. */
	gap: 0;
}

/* Narrow windows: the tree leaves the layout outright — the drawer rule below
   takes it out of flow — so its track goes with it rather than collapsing to
   zero width. It has to: a fixed-position child isn't a grid item at all, so a
   track left declared for it wouldn't sit there empty, it would take in the
   next item that *is* in flow — auto-placement would drop the body into the
   tree's old column and push the TOC into the body's. */
.docs-view-compact {
	grid-template-columns:
		minmax(0, 1fr)
		fit-content(var(--docs-toc-max-width));
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

/* The breadcrumb and the (compact-only) tree toggle read as one left-hand
   group, so they're wrapped together rather than left as separate children of
   a space-between row — which would push the breadcrumb into the middle of the
   page the moment the toggle appeared. min-width: 0 keeps the breadcrumb free
   to shrink here, which is what its own truncation measures against. */
.breadcrumb-leading {
	display: flex;
	align-items: center;
	gap: 0.25em;
	min-width: 0;
}

/* The tree is sticky in its own right at full width, always on screen however
   far the page has scrolled — so the button standing in for it can't be
   something you have to scroll back up to find. The row it lives in becomes
   the page's header instead: opaque (matching .docs-view's own background, so
   the body passes underneath it rather than through it) and above anything
   positioned in the body, but below the scrim, which dims this along with
   everything else the drawer covers. */
.docs-view-compact .breadcrumb-container {
	position: sticky;
	top: 0;
	z-index: 1;
	padding-bottom: 0.5em;
	background-color: var(--theme-bg-elevated);
	border-bottom: 1px solid var(--theme-border);
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
	/* Nothing on the right: what sits there instead is the scrollbar gutter
	   reserved below, so the rows run right up to the scrollbar's own track. */
	padding: 0.5em 0 0.5em 0.5em;
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

/* The drawer. Fixed rather than sticky, so it's out of flow entirely (hence
   the collapsed track above) and overlays the body instead of narrowing it,
   and pinned below NavBar the same way the rail's own max-height is. Closed,
   it's parked off the left edge — visibility (not display) so it keeps its
   place in the transition and drops out of the tab order without the tree
   itself unmounting or losing its scroll position. Capped against the viewport
   as well as the rail's own width, for windows narrower than the rail.

   The z-index only has to clear the scrim below it (and, through that, the
   sticky breadcrumb row): deliberately kept low, since @nuxt/ui's teleported
   overlays (modals, the docs search palette) carry no z-index of their own and
   stack on DOM order alone, so anything ambitious here would sit on top of
   them. */
.docs-view-compact .docs-view-tree {
	position: fixed;
	top: var(--nav-height);
	left: 0;
	z-index: 3;
	width: min(var(--docs-tree-max-width), 85vw);
	height: calc(100vh - var(--nav-height));
	max-height: none;
	/* padding: 1em 0.75em; */
	background-color: var(--theme-bg-elevated);
	border-right: 1px solid var(--theme-border);
	box-shadow: 0.25rem 0 1.5rem rgb(0 0 0 / 0.35);
	transform: translateX(-100%);
	visibility: hidden;
	transition: transform 0.15s ease, visibility 0.15s;
}

.docs-view-compact.docs-view-tree-open .docs-view-tree {
	transform: none;
	visibility: visible;
}

/* Dims (and swallows clicks on) everything the drawer is covering, NavBar
   excepted — it stays reachable, same as it is behind the drawer itself. */
.docs-view-scrim {
	position: fixed;
	inset: var(--nav-height) 0 0 0;
	z-index: 2;
	background-color: rgb(0 0 0 / 0.45);
}

/* Matches the drawer's own slide, so the two arrive and leave together. */
.scrim-enter-active,
.scrim-leave-active {
	transition: opacity 0.15s ease;
}

.scrim-enter-from,
.scrim-leave-to {
	opacity: 0;
}

.docs-view-container {
	max-width: 96rem;
	/* UContainer's own theme steps its inline padding twice on the way up
	   (px-4, then sm:px-6 at 640px, then lg:px-8 at 1024px), which the body
	   column wears as a jog sideways at each of those widths — the 1024px one
	   being the visible one, since it lands where the rails are already busy.
	   Fixed here instead, and at the breadcrumb row's own 1.5em, so the page
	   title and the text under it share a left edge at every width rather than
	   only in the middle band. */
	padding-inline: 1.5em;
	/* padding-block: 1.5em; */
}
</style>
