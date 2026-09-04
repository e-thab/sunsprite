import { createProgram, extractMixin, extractConcreteClass, extractObjectLiteral, extractFreeFunction } from './extract'
import { MIXINS, CONCRETE_CLASSES, OBJECT_LITERALS, FREE_FUNCTIONS } from './sources'

export interface MixinBundle {
    propsFields: string[]
    propsTypeDef: string
    api: string
}

export interface ConcreteClassBundle {
    propsFields: string[]
    members: string[]
}

export interface GeneratedDeclarations {
    mixins: Record<string, MixinBundle>
    concreteClasses: Record<string, ConcreteClassBundle>
    freeFunctions: Record<string, string>
}

/**
 * Walks the real mixin + concrete-class source and produces the same
 * declaration content apiLib.ts used to keep as hand-duplicated strings —
 * derived from real JSDoc and real composition instead.
 */
export function generateApiDeclarations(): GeneratedDeclarations {
    const { program, checker } = createProgram()

    const mixins: Record<string, MixinBundle> = {}
    for (const mixin of MIXINS) {
        const { propsFields, propsTypeDef, api } = extractMixin(program, checker, mixin)
        mixins[mixin.functionName] = { propsFields, propsTypeDef, api }
    }

    // Shared across concrete classes so each mixin's own members are only
    // walked once, and so GameObject's resolved composition is cached too.
    const mixinCache = new Map<string, Map<string, string>>()

    const concreteClasses: Record<string, ConcreteClassBundle> = {}
    for (const concrete of CONCRETE_CLASSES) {
        concreteClasses[concrete.className] = extractConcreteClass(program, checker, concrete, mixinCache)
    }
    // Random (a plain object literal, not a class) slots into the same
    // output bucket as the classes above — same {propsFields, members}
    // shape, so render.ts needs no separate handling for it.
    for (const literal of OBJECT_LITERALS) {
        concreteClasses[literal.className] = extractObjectLiteral(program, checker, literal)
    }

    const freeFunctions: Record<string, string> = {}
    for (const fn of FREE_FUNCTIONS) {
        freeFunctions[fn.name] = extractFreeFunction(checker, program, fn)
    }

    return { mixins, concreteClasses, freeFunctions }
}
