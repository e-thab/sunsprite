# Subset-Gated Trait Composition

Notes on a proposed system for defining traits as an abstract structure of *slots*,
where behavior is attached to subsets of those slots and composing classes select
which subset they want.

## The design

A trait declares a set of named slots, then attaches members to combinations of them:

```
Transformable defines (double x, double y, int width, int height, double rotation) {
    x        { {get, set} }                       // members for any object using x
    y        { {get, set} }
    width    { {get} }                            // readonly
    height   { {get} }
    rotation { {get, set}
               double rotationDegrees() { return rad2deg(self.rotation) } }

    x, y {                                        // requires BOTH x and y
        Vector2 getPosition() { return Vector2(self.x, self.y) }
    }

    x, y, rotation {                              // requires ALL THREE
        double lookAt(Transformable<x,y> other) { // partial composition as a type
            return self.getPosition().angleTo(other.getPosition())
        }
    }
}

class Posable uses { x, y, rotation } from Transformable {
    x { {get} }    // narrow to readonly
    y { {get} }
}

class Sizable uses { width, height } from Transformable {}
```

## Is this a known pattern?

Yes — but not as one pattern. It is a recombination of about five, and each piece has
an established name.

| Construct | Known as | Where it exists |
|---|---|---|
| `Transformable defines (x, y, ...)` — a trait declaring slots it *requires* | required / abstract members of a trait | Schärli et al., *Traits: Composable Units of Behaviour* (ECOOP '03); Scala self-types `trait T { self: HasX with HasY => }` |
| `x, y { ... }` — members that exist only given a subset | **conditional conformance** / constrained extension | Swift `extension P where Self: HasX & HasY`; Rust blanket impl `impl<T: HasX + HasY> Position for T`; Haskell `instance (HasX a, HasY a) => Positioned a` |
| `Transformable<x,y>` — partial composition as a type | **row polymorphism** (`{x: num, y: num \| ρ}`) | PureScript, OCaml objects; TS structural types approximate it |
| One abstract structure → a family of valid compositions | **feature model**; a block gated on a combination is a **feature derivative** | Feature-Oriented Programming (Batory's AHEAD; Liu/Batory/Lengauer); variability-aware type checking (Kästner) |
| `width \| height` + `self has width` | **`Or` query filters** | Bevy `Or<(With<Width>, With<Height>)>`; flecs `\|\|`; C++20 `if constexpr (requires { t.width; })` |
| A composing class re-opening `x` as readonly | **feature adaptation** (rename / redefine / undefine / export) | Eiffel inheritance clauses; the trait algebra's exclusion and aliasing operators |

The ECS row is the interesting one for a game engine: `x, y, rotation { lookAt() }` *is*
a Bevy system with an archetype query. The difference is that ECS deliberately keeps
behavior out of the entity, while this design puts it back on the object and keeps only
the query-based gating.

## The structure underneath

The slots form a powerset lattice, and each block attaches members to an **up-set** of it.
Any formula built from `,` (∧) and `|` (∨) without negation defines an up-closed set, so
composition is monotone: adding a slot can only add members, never remove them. That is
the invariant that makes `Transformable<x,y,rotation>` safely substitutable wherever
`Transformable<x,y>` is expected, and it is worth preserving deliberately.

## Dropping the `|` operator

Restricting the system to conjunction only is the recommended form. It stops being a
research language and becomes something Rust, Swift, and Scala already implement today:
plain bounded polymorphism over intersections.

`|` does **not** break monotonicity — a union of up-sets is still up-closed. What it
breaks is **body totality**: one body has to serve several different shapes, so it needs
a runtime tag (`self has`) and a statically-unreachable fallback (`return NaN`). That is
the real cost being removed.

### No expressive power is lost

`|` is sugar. A disjunctive block desugars into conjunctive ones:

```
width          { double length() { return self.width } }
height         { double length() { return self.height } }
width, height  { double length() { return Vector2(self.width, self.height).length() } }
```

Three total bodies instead of one partial body with runtime branches; dispatch moves from
runtime to composition time. The cost is that covering a disjunction over *n* slots
exhaustively takes up to 2ⁿ − 1 blocks — so `|` was compressing an exponential, which is
why the sugar stops paying for itself past two or three slots.

### The rules it replaces `|` with

A specificity rule is now required, since `{width}`, `{height}` and `{width, height}` all
match an object having both:

- Applicable blocks for a composition = every block whose slot set is a subset of the
  composed set.
- Members = the union over those, **most specific wins** (more slots = more specific).
- If two *incomparable* blocks define the same member and no more-specific block resolves
  it, that is a static error requiring explicit disambiguation at the composing class.

The last clause is the design decision that matters. Schärli's traits deliberately require
explicit conflict resolution rather than auto-linearizing, and that is the better choice —
Scala's linearization silently picks a winner and the mistake surfaces at runtime. The rule
is decidable, order-independent and confluent, so `uses` order never affects the result.

### Runtime payoff

Nothing needs a capability set at runtime. Every block resolves at composition time and
flattens into the prototype: no per-object slot tags, no branch in hot paths.

## Application to sunsprite

A survey of `src/assets/api/mixins/` found **no genuine disjunction anywhere**:

- `position`, `pos`, `distanceTo`, `goTo`, `screenPosition` — all need exactly `{x, y}`
- `lookAt` (currently a TODO stub in `Rotatable.ts`) — needs `{x, y, rotation}`
- `AlignableLike` — needs `{x, y, width, height}`
- `Fillable`, `Outlinable`, `Timeable`, `Viewable` — self-contained, no cross-slot members

Pure conjunction, all of it. The restricted fragment covers the entire API surface.

Two pieces of the design are already hand-rolled in the codebase:

- `Alignable.ts`'s `AlignableLike = { x, y, width, height }` is `Transformable<x,y,width,height>`
  written out longhand.
- `Rotatable.ts`'s `lookAt` is stubbed precisely because it is a derivative — it needs the
  `x, y` that `Rotatable` does not own.

The TypeScript-native encoding is: one interface per slot, then members bounded on
intersections of them, with the mixin factories taking `Base extends Class<HasX & HasY>`
instead of `Class`. The block syntax is lost, but the gating comes free from the structural
type system.

### The gap that remains

There is a variability constraint in the codebase that the conjunction-only system
*also* cannot express, and it is worth separating from `|` because it looks similar:

- `Rotatable.ts` — `rotation` xor `radians`
- `Sizable.ts` — `scale` xor `width`/`height`

That is not behavior gated on a disjunction; it is a constraint on which slot combinations
are legal to initialize together, currently enforced by a runtime `if` and a `// warn?`
comment. Feature models have a separate clause for this (`excludes`), orthogonal to
everything above. If the trait system gets built, this is the piece worth designing in
alongside the conjunctive blocks.

## References

- Schärli, Ducasse, Nierstrasz, Black — *Traits: Composable Units of Behaviour*, ECOOP 2003
- Liu, Batory, Lengauer — *Feature Oriented Refactoring of Legacy Applications*, ICSE 2006 (derivatives)
- Kästner et al. — variability-aware type checking
- Bevy ECS query filters (`With`, `Or`); flecs query DSL
- TypeScript handbook — [Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)
