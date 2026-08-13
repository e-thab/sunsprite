import type { DocNode } from './docsTypes'
import { gettingStarted } from './content/gettingStarted'
import { api } from './content/api'
import { tutorials } from './content/tutorials'
import { challenges } from './content/challenges'
import { tips } from './content/tips'
import { uiFeatures } from './content/ui'

export * from './docsTypes'

export const docsTree: DocNode[] = [
	gettingStarted,
	api,
	tutorials,
	challenges,
	tips,
	uiFeatures,
]
