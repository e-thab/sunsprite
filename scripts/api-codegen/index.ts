import { createProgram, extractMixin, extractConcreteClass, extractObjectLiteral, extractFreeFunction, extractTypeAlias, type MemberSet, type TypeAliasBundle } from './extract'
import { MIXINS, CONCRETE_CLASSES, TYPE_ONLY_CLASSES, OBJECT_LITERALS, FREE_FUNCTIONS, TYPE_ALIASES } from './sources'

export interface MixinBundle {
    propsFields: string[]
    propsTypeDef: string
    api: string
    /** For the docs' Default column — see render.ts's renderDocDefaultsModule. */
    defaults: Record<string, string>
}

export interface ConcreteClassBundle {
    doc: string
    propsFields: string[]
    members: string[]
    /** For the docs' Default column — see render.ts's renderDocDefaultsModule. */
    defaults: Record<string, string>
}

export interface GeneratedDeclarations {
    mixins: Record<string, MixinBundle>
    concreteClasses: Record<string, ConcreteClassBundle>
    freeFunctions: Record<string, string>
    typeAliases: Record<string, TypeAliasBundle>
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
        const { propsFields, propsTypeDef, api, defaults } = extractMixin(program, checker, mixin)
        mixins[mixin.functionName] = { propsFields, propsTypeDef, api, defaults }
    }

    // Shared across concrete classes so each mixin's own members are only
    // walked once, and so GameObject's resolved composition is cached too.
    const mixinCache = new Map<string, MemberSet>()

    const concreteClasses: Record<string, ConcreteClassBundle> = {}
    for (const concrete of CONCRETE_CLASSES) {
        concreteClasses[concrete.className] = extractConcreteClass(program, checker, concrete, mixinCache)
    }
    // Same {doc, members} output; only how apiLib/snapshot-api declare them differs.
    for (const typeOnly of TYPE_ONLY_CLASSES) {
        concreteClasses[typeOnly.className] = extractConcreteClass(program, checker, typeOnly, mixinCache)
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

    const typeAliases: Record<string, TypeAliasBundle> = {}
    for (const alias of TYPE_ALIASES) {
        typeAliases[alias.name] = extractTypeAlias(program, checker, alias)
    }

    return { mixins, concreteClasses, freeFunctions, typeAliases }
}
