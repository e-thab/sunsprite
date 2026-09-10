<script setup lang="ts">
import { reactive } from 'vue'
import CollapsiblePane from './CollapsiblePane.vue'
import { useEditorSettingsStore, EDITOR_SETTINGS_DEFAULTS } from '@/stores/editorSettingsStore'
import { useProjectSettingsStore, PROJECT_SETTINGS_DEFAULTS } from '@/stores/projectSettingsStore'
import { useApiVersionStore } from '@/stores/apiVersionStore'
import { familyScriptTypes, SCRIPT_FAMILIES, scriptFamilyById } from '@/assets/utils/fileTypes'
import { listApiVersions, latestApiVersion, DEV_VERSION_AVAILABLE } from '@/assets/api/versions'
import { DEV_VERSION } from '@/assets/api/versions/constants'

const editorSettingsStore = useEditorSettingsStore()
const projectSettingsStore = useProjectSettingsStore()
const apiVersionStore = useApiVersionStore()

// Read through these in the accessors below rather than through the store
// wrappers each time — they're the reactive objects themselves, so a getter
// touching one is what ties a row's rendered value to the live setting.
const editorSettings = editorSettingsStore.settings
const projectSettings = projectSettingsStore.settings

// Editor settings pane (bottom of the explorer column, under the asset
// library). Starts collapsed — see EditorView.vue's settings-v-pane item —
// since nothing in here is needed mid-session the way the file tree and
// assets are.
//
// Every row is a view onto state that lives somewhere else, never a value of
// its own: each entry carries a get/set pair pointing at whichever store
// actually owns the setting, so this file stays a layout and the stores stay
// the source of truth. That split is what lets a setting apply live — the
// consumer (CodeEditor, OutputPane, ...) watches the store, and never has to
// know this panel exists.
//
// Where each group persists:
//   - editor.*  -> editorSettingsStore, localStorage; follows the machine.
//   - everything else -> projectSettingsStore, the project's own `settings`
//     column (or localStorage in the guest sandbox, which has no row).
//     project.version is the exception: it predates this and keeps its own
//     dedicated column, reached through apiVersionStore.
//
// Adding one is meant to be a data change, not a layout change: append to
// SETTINGS_GROUPS with a get/set pair and the row, its control, and its
// wiring all follow from the entry itself.

type SettingValue = boolean | number | string

type SettingControl =
	| { kind: 'switch' }
	| { kind: 'checkbox' }
	| { kind: 'slider', min: number, max: number, step?: number, suffix?: string }
	| { kind: 'text', placeholder?: string }
	| { kind: 'color' }
	| { kind: 'number', min?: number, max?: number }
	| { kind: 'radio', items: { label: string, value: string }[] }
	| { kind: 'select', items: string[] }

interface Setting {
	id: string
	label: string
	/**
	 * Shown as the row's hover tooltip — for anything the label alone doesn't
	 * carry. A function for a description whose text depends on live state, the
	 * way project.runtime's does: the extensions it names come from whichever
	 * family is selected, so a fixed string would start lying the moment a
	 * second family exists.
	 */
	description?: string | (() => string)
	control: SettingControl
	/** Reads the live value from whichever store owns it. */
	get: () => SettingValue
	/** Writes it back. Persistence is the store's business, not this panel's. */
	set: (value: SettingValue) => void
	/** What the reset button restores, and what its visibility is judged against. */
	default: SettingValue
	/** Greyed out and inert while this returns true — see project.autosaveInterval. */
	disabled?: () => boolean
	/**
	 * Not rendered at all while this returns true — for a row that isn't merely
	 * inapplicable right now but meaningless, where disabling would leave a
	 * permanently greyed control asking a question that can't apply. The case
	 * this exists for is a row belonging to one script family only (see
	 * fileTypes.ts): a Python-specific setting has nothing to say about a
	 * JavaScript project.
	 *
	 * Unused as it stands — the row it was added for (an "Allow TypeScript"
	 * toggle) turned out to be modelling a capability that never existed, and
	 * was removed rather than hidden.
	 */
	hidden?: () => boolean
	/**
	 * Set false for a row where `default` is only "what a new project starts
	 * as", not a preference worth restoring — the project's API version, its
	 * language, whether it allows TypeScript. Offering to reset those reads as
	 * an undo, but each one is a change *to the project* rather than to how the
	 * editor behaves: re-pinning the API version moves which API the code runs
	 * against, and a project that already has .ts files in it isn't made
	 * JavaScript-only again by flipping a switch back.
	 *
	 * `default` stays meaningful either way — it's still what `isDefault`
	 * judges the row's at-default styling against.
	 */
	resettable?: boolean
}

interface SettingsGroup {
	id: string
	label: string
	settings: Setting[]
}

// Controls that need the full pane width to be usable at all — a radio
// group's options and a slider's track both read as cramped squeezed into
// the right half of a row next to their label, at any pane width the
// explorer column realistically gets dragged to.
const STACKED_KINDS = new Set<SettingControl['kind']>(['radio', 'slider'])

// How the "N minutes" labels the autosave interval control offers map onto
// the minutes the store actually holds. Kept as one list so the two
// directions can't disagree — a label the control can show that the store
// can't round-trip would strand the setting on a value it can never display.
const AUTOSAVE_INTERVALS: { label: string, minutes: number }[] = [
	{ label: '1 minute', minutes: 1 },
	{ label: '5 minutes', minutes: 5 },
	{ label: '10 minutes', minutes: 10 },
]

function autosaveIntervalLabel(minutes: number): string {
	return AUTOSAVE_INTERVALS.find((option) => option.minutes === minutes)?.label
		?? AUTOSAVE_INTERVALS[1]!.label
}

function autosaveIntervalMinutes(label: SettingValue): number {
	return AUTOSAVE_INTERVALS.find((option) => option.label === label)?.minutes
		?? PROJECT_SETTINGS_DEFAULTS.autosaveIntervalMinutes
}

// Script languages are offered by label but stored by id — the same
// display/value split as AUTOSAVE_INTERVALS above, and for the same reason:
// the id is what's persisted (and what fileTypes.ts keys its registry on), so
// it has to survive the label being reworded.
function scriptFamilyLabel(id: string): string {
	return scriptFamilyById(id).label
}

function scriptFamilyId(label: SettingValue): string {
	return SCRIPT_FAMILIES.find((family) => family.label === label)?.id
		?? PROJECT_SETTINGS_DEFAULTS.scriptFamily
}

/**
 * "Scripts can be .js or .ts." — built from the selected family's own types
 * rather than written out, so it can't claim an extension the family doesn't
 * have. This is where the fact that a JavaScript project takes TypeScript gets
 * stated; the label stays the short family name.
 */
function scriptFamilyDescription(): string {
	const extensions = familyScriptTypes(projectSettings.scriptFamily).map((type) => `.${type.extension}`)
	const list = extensions.length > 1
		? `${extensions.slice(0, -1).join(', ')} or ${extensions[extensions.length - 1]}`
		: extensions[0] ?? ''
	return `The scripting language family. Scripts can be ${list}.`
}

// Every version the editor can actually be switched to, in the same order
// (and with the same dev-build-only 'dev' entry) as CodeEditor.vue's own
// header dropdown — both read the same source, so the two lists can't drift
// apart as versions are cut.
const API_VERSION_ITEMS: string[] = [
	...(DEV_VERSION_AVAILABLE ? [DEV_VERSION] : []),
	...listApiVersions(),
]

// Controls whose value the widget can hand back wrapped (USlider emits an
// array when it has multiple thumbs, a scalar when it has one) or as the
// wrong primitive. Normalizing in the setters keeps every store holding the
// type it declares, rather than each consumer defending against the panel.
function asNumber(value: SettingValue, fallback: number): number {
	const raw = Array.isArray(value) ? value[0] : value
	const num = typeof raw === 'number' ? raw : Number(raw)
	return Number.isFinite(num) ? num : fallback
}

function asBoolean(value: SettingValue): boolean {
	return Boolean(Array.isArray(value) ? value[0] : value)
}

function asString(value: SettingValue): string {
	return String(Array.isArray(value) ? value[0] : value)
}

const SETTINGS_GROUPS: SettingsGroup[] = [
	{
		id: 'project',
		label: 'Project',
		settings: [
			{
				id: 'project.version',
				label: 'Version',
				control: { kind: 'select', items: API_VERSION_ITEMS },
				// Straight through apiVersionStore, which is also what
				// CodeEditor.vue's header dropdown calls — so picking a
				// version here swaps Monaco's declarations, repoints the
				// sandbox, and pins the project's api_version column exactly
				// as picking it up there does. See that store's selectVersion.
				get: () => apiVersionStore.selectedVersion,
				set: (value) => apiVersionStore.selectVersion(asString(value)),
				// The tier a brand-new project is created against, so "reset"
				// means the same thing here as it does at creation.
				default: latestApiVersion(),
				resettable: false,
			},
			{
				id: 'project.runtime',
				label: 'Runtime',
				// Names the *family* — the runtime, which is the thing that genuinely
				// can't mix. "JavaScript" covers TypeScript too (see
				// fileTypes.ts's SCRIPT_FAMILIES for why that isn't a shortcut), and
				// the description is what says so.
				description: scriptFamilyDescription,
				control: { kind: 'select', items: SCRIPT_FAMILIES.map((family) => family.label) },
				get: () => scriptFamilyLabel(projectSettings.scriptFamily),
				set: (value) => projectSettingsStore.set('scriptFamily', scriptFamilyId(value)),
				default: scriptFamilyLabel(PROJECT_SETTINGS_DEFAULTS.scriptFamily),
				resettable: false,
			},
			{
				id: 'project.autosave',
				label: 'Autosave',
				description: 'Save changed scripts on a timer.',
				control: { kind: 'switch' },
				get: () => projectSettings.autosave,
				set: (value) => projectSettingsStore.set('autosave', asBoolean(value)),
				default: PROJECT_SETTINGS_DEFAULTS.autosave,
			},
			{
				id: 'project.autosaveInterval',
				label: 'Autosave interval',
				control: { kind: 'select', items: AUTOSAVE_INTERVALS.map((option) => option.label) },
				get: () => autosaveIntervalLabel(projectSettings.autosaveIntervalMinutes),
				set: (value) => projectSettingsStore.set('autosaveIntervalMinutes', autosaveIntervalMinutes(value)),
				default: autosaveIntervalLabel(PROJECT_SETTINGS_DEFAULTS.autosaveIntervalMinutes),
				// Nothing to schedule while autosave is off, so the interval
				// is inert rather than merely ignored — it stays visible (its
				// value still matters the moment autosave comes back on)
				// but can't be changed to something that has no effect.
				disabled: () => !projectSettings.autosave,
			},
			{
				id: 'project.autoRun',
				label: 'Auto run',
				description: 'Re-run the game shortly after a script changes.',
				control: { kind: 'switch' },
				get: () => projectSettings.autoRun,
				set: (value) => projectSettingsStore.set('autoRun', asBoolean(value)),
				default: PROJECT_SETTINGS_DEFAULTS.autoRun,
			},
		],
	},
	{
		id: 'editor',
		label: 'Editor',
		settings: [
			{
				id: 'editor.fontSize',
				label: 'Font size',
				// control: { kind: 'slider', min: 10, max: 24, step: 1, suffix: 'px' },
				control: { kind: 'number', min: 10, max: 24 },
				get: () => editorSettings.fontSize,
				set: (value) => { editorSettings.fontSize = asNumber(value, EDITOR_SETTINGS_DEFAULTS.fontSize) },
				default: EDITOR_SETTINGS_DEFAULTS.fontSize,
			},
			{
				id: 'editor.wordWrap',
				label: 'Word wrap',
				description: 'Wrap long lines instead of scrolling sideways.',
				control: { kind: 'switch' },
				get: () => editorSettings.wordWrap,
				set: (value) => { editorSettings.wordWrap = asBoolean(value) },
				default: EDITOR_SETTINGS_DEFAULTS.wordWrap,
			},
			{
				id: 'editor.lineNumbers',
				label: 'Line numbers',
				control: { kind: 'checkbox' },
				get: () => editorSettings.lineNumbers,
				set: (value) => { editorSettings.lineNumbers = asBoolean(value) },
				default: EDITOR_SETTINGS_DEFAULTS.lineNumbers,
			},
			{
				id: 'editor.tabSize',
				label: 'Tab size',
				// Stored as a number, offered as strings: USelect's items are
				// what it renders *and* what it emits, and a numeric item list
				// would put raw numbers in the menu with no way to label them.
				control: { kind: 'select', items: ['2', '4', '8'] },
				get: () => String(editorSettings.tabSize),
				set: (value) => { editorSettings.tabSize = asNumber(value, EDITOR_SETTINGS_DEFAULTS.tabSize) },
				default: String(EDITOR_SETTINGS_DEFAULTS.tabSize),
			},
		],
	},
	{
		id: 'game',
		label: 'Game',
		// NOTE: the only rows left unwired. They render and respond to input,
		// but read and write a scratch record that nothing consumes — see
		// gamePlaceholders below. Wiring one means giving it a get/set pair
		// like every row above: add the field to ProjectSettings (and its
		// default) in projectSettingsStore.ts, then
		// `get: () => projectSettings.x, set: (v) => projectSettingsStore.set('x', ...)`.
		// Persistence, hydration, and the guest-sandbox fallback all come
		// with that for free.
		settings: [
			{
				id: 'game.frameRate',
				label: 'Target frame rate',
				control: { kind: 'number' },
				get: () => gamePlaceholders['game.frameRate']!,
				set: (value) => { gamePlaceholders['game.frameRate'] = value },
				default: 60,
			},
			{
				id: 'game.background',
				label: 'Background color',
				description: 'Used when a script never sets one.',
				control: { kind: 'color' },
				get: () => gamePlaceholders['game.background']!,
				set: (value) => { gamePlaceholders['game.background'] = value },
				default: '#353b48',
			},
			{
				id: 'game.pauseOnBlur',
				label: 'Pause when unfocused',
				control: { kind: 'switch' },
				get: () => gamePlaceholders['game.pauseOnBlur']!,
				set: (value) => { gamePlaceholders['game.pauseOnBlur'] = value },
				default: true,
			},
		],
	},
	{
		id: 'output',
		label: 'Output',
		settings: [
			{
				id: 'output.maxLines',
				label: 'Max lines kept',
				description: 'Changing this clears the panel.',
				control: { kind: 'number', min: 10, max: 1000 },
				get: () => projectSettings.outputMaxLines,
				set: (value) => projectSettingsStore.set('outputMaxLines', asNumber(value, PROJECT_SETTINGS_DEFAULTS.outputMaxLines)),
				default: PROJECT_SETTINGS_DEFAULTS.outputMaxLines,
			},
			{
				id: 'output.autoScroll',
				label: 'Scroll to newest',
				control: { kind: 'checkbox' },
				get: () => projectSettings.outputAutoScroll,
				set: (value) => projectSettingsStore.set('outputAutoScroll', asBoolean(value)),
				default: PROJECT_SETTINGS_DEFAULTS.outputAutoScroll,
			},
		],
	},
]

// Backing state for the Game rows only — the one group still unwired (see
// its NOTE above). Deliberately not persisted: a value that survives a
// reload but changes nothing would be worse than an obviously inert one.
const gamePlaceholders = reactive<Record<string, SettingValue>>({
	'game.frameRate': 60,
	'game.background': '#353b48',
	'game.pauseOnBlur': true,
})

const ALL_SETTINGS: Setting[] = SETTINGS_GROUPS.flatMap((group) => group.settings)

/**
 * `values[id]` reads and writes the store behind that row, via the accessor
 * pair the entry declared. A plain object with getter/setter properties
 * rather than a reactive() one, deliberately: there's no state here to make
 * reactive — the reactivity that matters belongs to the stores those getters
 * touch, and a template reading `values[id]` picks it up from them directly.
 */
const values = {} as Record<string, SettingValue>
for (const setting of ALL_SETTINGS) {
	Object.defineProperty(values, setting.id, {
		get: setting.get,
		set: setting.set,
		enumerable: true,
	})
}

const settingsById = new Map(ALL_SETTINGS.map((setting) => [setting.id, setting]))

function getValue(settingId: string): SettingValue | undefined {
	const entry = values[settingId]
	return Array.isArray(entry) ? entry[0] : entry
}

function isDefault(settingId: string): boolean {
	const setting = settingsById.get(settingId)
	return !setting || setting.get() === setting.default
}

function resetSetting(settingId: string) {
	const setting = settingsById.get(settingId)
	if (setting) setting.set(setting.default)
}

/**
 * Whether this row shows its reset button right now — already at its default
 * has nothing to restore, and an unresettable row never offers one.
 *
 * Also what drives .setting-at-default: that class exists to let the label
 * span the reset column when no button occupies it, so it has to follow
 * "is there a button" rather than "is the value default" — the two came to the
 * same thing until some rows stopped being resettable at all.
 */
/** A row's description text, whether it's fixed or derived from live state. */
function descriptionOf(setting: Setting): string | undefined {
	return typeof setting.description === 'function' ? setting.description() : setting.description
}

function showsReset(setting: Setting): boolean {
	return setting.resettable !== false && !isDefault(setting.id)
}

function isDisabled(setting: Setting): boolean {
	return setting.disabled?.() ?? false
}

/**
 * The rows a group actually shows right now. A plain function rather than a
 * computed: the predicates read straight through to the stores, so calling
 * this during render is what ties the list to them — a row appears the moment
 * the setting it depends on changes.
 */
function visibleSettings(group: SettingsGroup): Setting[] {
	return group.settings.filter((setting) => !setting.hidden?.())
}

function isStacked(setting: Setting): boolean {
	return STACKED_KINDS.has(setting.control.kind)
}
</script>

<template>
	<CollapsiblePane label="Settings" icon="tabler:settings-filled">
	<div class="panel-wrapper">
		<div class="panel-bar">
			<div class="spacer"></div>
			<div>Settings</div>
			<div class="spacer"></div>
		</div>

		<div class="settings-list">
			<section v-for="group in SETTINGS_GROUPS" :key="group.id" class="settings-group">
				<h3 class="settings-group-label">{{ group.label }}</h3>

				<div
					v-for="setting in visibleSettings(group)"
					:key="setting.id"
					class="setting"
					:class="{ 'setting-stacked': isStacked(setting), 'setting-disabled': isDisabled(setting), 'setting-at-default': !showsReset(setting) }"
				>
					<!-- The description is carried as a tooltip rather than rendered
					     under the row: this pane is narrow enough that a wrapping
					     line of help text under every control roughly doubles the
					     list's height (which is why the inline version below is
					     commented out). UTooltip disables itself when `text` is
					     empty, so rows without a description need no guard here,
					     and its trigger is `as-child` — no wrapper element, so
					     the label stays the grid item .setting's subgrid expects. -->
					<UTooltip :text="descriptionOf(setting)">
						<label
							:for="setting.id"
							class="setting-label"
						>{{ setting.label }}</label>
					</UTooltip>

					<UTooltip v-if="showsReset(setting)" text="Reset to default">
						<UButton
							class="reset-btn"
							icon="tabler:refresh"
							variant="ghost"
							color="primary"
							:disabled="isDisabled(setting)"
							size="xs"
							@click="resetSetting(setting.id)"
						/>
					</UTooltip>

					<div class="setting-control">
						<div v-if="setting.control.kind === 'switch'" class="control-switch">
							<USwitch
								class="flex-1"
								:id="setting.id"
								v-model="(values[setting.id] as boolean)"
								:disabled="isDisabled(setting)"
								size="xs"
							/>
							<div>{{ getValue(setting.id) ? 'On' : 'Off' }}</div>
						</div>

						<div v-else-if="setting.control.kind === 'checkbox'" class="control-switch">
							<UCheckbox
								class="flex-1"
								:id="setting.id"
								v-model="(values[setting.id] as boolean)"
								:disabled="isDisabled(setting)"
								size="xs"
							/>
							<div>{{ getValue(setting.id) ? 'On' : 'Off' }}</div>
						</div>

						<div v-else-if="setting.control.kind === 'slider'" class="slider-row">
							<USlider
								:id="setting.id"
								v-model="(values[setting.id] as number)"
								:min="setting.control.min"
								:max="setting.control.max"
								:step="setting.control.step"
								:disabled="isDisabled(setting)"
								size="xs"
							/>
							<span class="slider-value">{{ getValue(setting.id) }}{{ setting.control.suffix ?? '' }}</span>
						</div>

						<UInput
							v-else-if="setting.control.kind === 'text'"
							class="flex-1"
							:id="setting.id"
							v-model="(values[setting.id] as string)"
							:placeholder="setting.control.placeholder"
							:disabled="isDisabled(setting)"
							size="xs"
							orientation="vertical"
						/>

						<!-- Swatch doubles as the trigger: the color *is* the
						     control, so there's nothing to click but it. The hex
						     sits alongside as a label rather than an input —
						     typing one is what the picker's own field is for. -->
						<UPopover v-else-if="setting.control.kind === 'color'">
							<button
								:id="setting.id"
								type="button"
								class="color-control"
								:disabled="isDisabled(setting)"
								:title="`${setting.label}: ${asString(getValue(setting.id) ?? '')}`"
							>
								<span class="color-swatch" :style="{ backgroundColor: asString(getValue(setting.id) ?? '') }"></span>
								<span class="color-hex">{{ asString(getValue(setting.id) ?? '') }}</span>
							</button>

							<template #content>
								<UColorPicker
									v-model="(values[setting.id] as string)"
									format="hex"
									size="sm"
									class="color-popover"
								/>
							</template>
						</UPopover>

						<UInputNumber
							v-else-if="setting.control.kind === 'number'"
							class="flex-1"
							:id="setting.id"
							v-model="(values[setting.id] as number)"
							:min="setting.control.min"
							:max="setting.control.max"
							:disabled="isDisabled(setting)"
							size="xs"
							orientation="vertical"
						/>

						<URadioGroup
							v-else-if="setting.control.kind === 'radio'"
							:id="setting.id"
							v-model="(values[setting.id] as string)"
							:items="setting.control.items"
							:disabled="isDisabled(setting)"
							size="xs"
						/>

						<!-- min-w-0 twice, and both are load-bearing. Nuxt UI's
						     select theme already puts Tailwind's `truncate` on
						     the value slot, but it can never engage on its own:
						     the trigger and the value span inside it are both
						     flex items defaulting to min-width:auto, so each
						     refuses to shrink below its own content and a long
						     option just widens the trigger straight out of its
						     grid cell instead of ellipsizing. Clearing it on the
						     trigger (via class, which the theme merges into its
						     `base` slot) lets the control shrink to the cell;
						     clearing it on value/placeholder is what finally
						     lets the text truncate inside it. -->
						<USelect
							v-else-if="setting.control.kind === 'select'"
							class="flex-1 min-w-0"
							:ui="{ value: 'min-w-0', placeholder: 'min-w-0' }"
							:id="setting.id"
							v-model="(values[setting.id] as string)"
							:items="setting.control.items"
							:disabled="isDisabled(setting)"
							size="xs"
						/>
					</div>
					
					<!-- <div class="setting-text">
						<p v-if="descriptionOf(setting)" class="setting-description">{{ descriptionOf(setting) }}</p>
					</div> -->

					<!-- <USeparator /> -->
				</div>
			</section>
		</div>
	</div>
	</CollapsiblePane>
</template>

<style scoped>
.settings-list {
	/* The one authoritative set of column tracks for the whole panel — every
	   .settings-group and .setting row below subgrids into these same three
	   columns instead of each computing its own, which is what actually
	   gets every row's control (and every row's reset button) starting at
	   the same x position regardless of how long that particular row's own
	   label happens to be. A row sizing its own label column only to fit
	   its own text is exactly the misalignment this replaces.

	   Track order: label, reset button, control — see the (now-shared)
	   shrink-priority reasoning above .setting below; it applies the same
	   way, just resolved once here instead of once per row. */
	/* Enough for the widest control that still has to be readable at its
	   floor — the color row's swatch plus a full "#rrggbb" (a truncated hex
	   is the one control whose label going "#20…" makes it useless rather
	   than merely tight). Everything else fits comfortably inside this. */
	--setting-control-min: 4.5rem;
	/* A fixed cap rather than max-content: this column is shared by every
	   row's label (subgrid — see the comment below), so a max-content track
	   sizes itself to the single widest *unspanned* label anywhere in the
	   panel, recomputed live as rows toggle in and out of .setting-at-default
	   (see that class below). A row like "Pause when unfocused" losing its
	   span the moment its reset button appears would then grow this track
	   for every row at once, shoving the reset button and control column
	   right along with it — the label truncating via .setting-label's own
	   ellipsis never gets a chance to fire, since max-content never leaves
	   anything for it to clip. Pinning the ceiling here means a label that
	   doesn't fit actually ellipsizes instead of resizing the shared track. */
	--setting-label-max: 7.5rem;
	display: grid;
	grid-template-columns: minmax(2.5rem, var(--setting-label-max)) 1.5rem minmax(var(--setting-control-min), 1fr);
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	padding: 0.5em 0.6em 0.8em;
	background-color: var(--theme-bg-elevated);
	color: var(--theme-text);
	font-size: 0.85em;
}

.settings-group {
	/* Spans, then subgrids, .settings-list's three columns — this is what
	   lets a .setting row several levels down still resolve against the
	   *panel's* shared tracks rather than starting a new independent grid
	   at the group level. */
	display: grid;
	grid-template-columns: subgrid;
	grid-column: 1 / -1;
}

.settings-group + .settings-group {
	margin-top: 0.6em;
}

.settings-group-label {
	/* Spans every column of the subgrid — without this it would land in
	   column 1 only (the label column), like any other grid item defaults
	   to occupying a single track. */
	grid-column: 1 / -1;
	background-color: var(--theme-bg-elevated);
	padding: 0.2em 0;
	margin: 0 0.35em;
	color: var(--theme-text-muted);
	font-size: 0.9em;
	font-weight: bold;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	user-select: none;
}

.setting {
	/* Subgrids .settings-group's (themselves subgridded from .settings-list)
	   three columns — see the comment on .settings-list above for why this
	   chain exists. Track order matches DOM order: label, reset button,
	   control.
	   - Label: minmax(0, max-content) — wants its natural content width, but
	     its floor is 0, so it *can* give up space. It just won't, unless
	     forced.
	   - Reset button: a bare length is its own min and max, so this track
	     never grows or shrinks regardless of how tight the row gets.
	   - Control: minmax(--setting-control-min, 1fr) — the only 1fr track, so
	     it's first in line for whatever space is available, and first to
	     give it back once the row gets tight. Once it's pinned at its floor
	     and there's still not enough room, Grid has nowhere left to reclaim
	     space from except the label (the only other track with slack) — so
	     *that's* when it finally starts shrinking too. That ordering falls
	     out of how Grid resolves track sizes; nothing here is hand-rolling it.
	     All of this now resolves once, at the .settings-list level, and
	     every row just inherits the result — which is the whole point: a
	     shared floor and shared shrink behavior is what keeps every row's
	     columns landing in the same place as every other row's. */
	display: grid;
	grid-template-columns: subgrid;
	grid-column: 1 / -1;
	align-items: center;
	min-width: 2em;
	
	gap: 0.6em;
	padding: 0.35em;
	margin: 0 0.35em;
	border-top: 1px dashed var(--theme-border);
}

/* Radio groups and sliders (see STACKED_KINDS) get the row's full width,
   under their label, rather than sharing it side by side. */
.setting-stacked {
	flex-direction: column;
	/* align-items: stretch; */
	/* gap: 0.35em; */
}

/* A row whose setting can't currently do anything (see Setting.disabled —
   the autosave interval while autosave is off). Only the label needs dimming
   here: the controls are handed the same flag as a real `disabled` prop, so
   they already render and behave as inert on their own. */
.setting-disabled .setting-label {
	opacity: 0.5;
}

.setting-text {
	/* Lets a long label ellipsize instead of pushing its control out of the
	   pane — flex items floor at min-content width without this. */
	min-width: 0;
}

.setting-label {
	display: block;
	/* The grid item's own automatic minimum size otherwise floors it at its
	   content's min-content width regardless of what the column's own
	   minmax(0, ...) says — same reason a flex item needs this. Without it,
	   .setting's label column could never actually reach a shrunk width in
	   the first place. */
	min-width: 2em;
	min-height: 1.5rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* A row sitting at its default has no reset button, and the column it would
   have occupied is dead space the label may as well use — so the label spans
   into it rather than truncating early against a gap with nothing in it.
   Nothing moves when the button later appears: the tracks themselves are
   defined once on .settings-list (see its comment) and are identical for
   every row either way, so this only ever changes how much of *that* row's
   label is visible, never where the reset column or the control sit. That's
   also why the button is simply absent now rather than swapped for a
   same-sized placeholder — the placeholder was what reserved the gap the
   label couldn't cross. */
.setting-at-default .setting-label {
	grid-column: 1 / 3;
}

.setting-description {
	/* margin: 0.1em 0 0; */
	color: var(--theme-text-muted);
	font-size: 0.85em;
	/* Free to wrap — unlike the label, this is the part that can afford the
	   vertical room, and truncating it to one line would usually cut it
	   mid-sentence at this pane's width. */
	white-space: normal;
}

.setting-control {
	/* Same reasoning as .setting-label above: this is the grid item that
	   actually needs to shrink down toward the control column's
	   --setting-control-min floor, which its own automatic minimum size
	   would otherwise block. */
	min-width: 0;
	display: flex;
	gap: 0.6em;
	align-items: center;
}

/* .setting-stacked .setting-control {
	display: flex;
	justify-content: space-between;
	width: 100%;
	flex-shrink: 1;
} */

.reset-btn {
	min-width: 1.5rem;
	height: 1.5rem;
}

.control-switch {
	display: flex;
	align-items: center;
	gap: 0.6em;
}

.slider-row {
	display: flex;
	align-items: center;
	gap: 0.6em;
	width: 100%;
}

.slider-row > :first-child {
	flex: 1 1 auto;
	min-width: 0;
}

.slider-value {
	flex-shrink: 0;
	min-width: 3.5ch;
	text-align: right;
	color: var(--theme-text-muted);
	font-family: 'Fira Code', monospace;
	font-size: 0.9em;
}

/* Swatch + hex, as one button — the whole thing is the click target rather
   than just the square, so the label is no harder to hit than the color. */
.color-control {
	display: flex;
	align-items: center;
	gap: 0.3em;
	min-width: 0;
	padding: 0;
	background: none;
	border: none;
	font: inherit;
	color: inherit;
	cursor: pointer;
}

.color-control:disabled {
	cursor: default;
	opacity: 0.5;
}

.color-swatch {
	flex-shrink: 0;
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 0.5em;
	/* A border rather than nothing: a swatch set to the panel's own
	   background would otherwise read as an empty gap, and one set to a
	   near-black would lose its edge against the pane. */
	border: 1px solid var(--theme-border);
}

.color-hex {
	/* align-self: flex-end; */
	position: relative;
	top: 1px;
	min-width: 0;
	letter-spacing: -0.02em;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: var(--theme-text);
	font-family: 'Fira Code', monospace;
	/* font-size: 1em; */
}

/* .color-control:hover:not(:disabled) .color-hex {
	color: var(--theme-text);
} */

.spacer {
	width: 1.5em;
	flex: 0 1 auto;
}
</style>
