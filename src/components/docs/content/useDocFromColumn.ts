import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'

/**
 * Whether a table has a "From" column — decided by its rows, read by its
 * header.
 *
 * Only a page that composes traits has anything to put there: on a trait's
 * own page, or on a global like Clock, every member is the subject's own and
 * the column would be a dead header over an empty strip. The rows are the
 * ones that know (they're the ones given `from`), but the header is rendered
 * by the wrapper, so the two have to agree — hence this rather than a prop
 * each page would have to remember to set, and would misalign the table by
 * forgetting.
 */
type DocFromColumn = {
	/** True once any row in this table has declared a `from`. */
	present: Ref<boolean>
	mark: () => void
}

const docFromColumnKey: InjectionKey<DocFromColumn> = Symbol('docFromColumn')

/** Called by DocProperties/DocMethods; the returned ref drives their header cell. */
export function provideDocFromColumn(): Ref<boolean> {
	const present = ref(false)
	provide(docFromColumnKey, {
		present,
		mark: () => {
			present.value = true
		},
	})
	return present
}

/**
 * Called by DocProperty/DocMethod with their own `from`, which claims the
 * column for the whole table. The returned ref is what a row without a `from`
 * of its own reads to know it still owes the row an (empty) cell.
 */
export function useDocFromColumn(from: unknown): Ref<boolean> | undefined {
	const column = inject(docFromColumnKey, undefined)
	if (from) column?.mark()
	return column?.present
}
