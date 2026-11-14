import { game, scene } from "@api/core"

/**
 * Direct access to the Phaser engine objects running your game, for anything Sunsprite doesn't
 * cover itself. Changing these can break Sunsprite features in ways it can't warn you about.
 */
const Phaser = {
    /** The Phaser scene your game runs in. */
    get scene(): any {
        return scene
    },

    /** The running Phaser game instance. */
    get game(): any {
        return game
    },
}

export default Phaser
