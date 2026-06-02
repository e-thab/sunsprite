import { screen } from "./core"
import { Point } from "./Point";


export const random = {
    // Get a random int, min & max inclusive
    range(min: number, max: number): number {
        const minCeiled = Math.ceil(min)
        const maxFloored = Math.floor(max)
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled)
    },

    // TODO: exclusive range?

    // Random float in a given range (TODO: test -clusivity) 
    float(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    },

    // Random bool, 50% chance
    coinFlip(): boolean {
        return Math.random() >= 0.5
    },

    // Random dice roll
    roll(sides: number): number {
        return this.range(1, sides)
    },

    // TODO: Random color
    // color(): string {

    // },

    // Random rotation in radians
    radians(): number {
        return this.float(0, 2 * Math.PI)
    },

    // Random rotation in degrees
    degrees(): number {
        return this.range(1, 360)
    },

    // Random position inside screen
    position(): Point {
        return {
            x: this.x(),
            y: this.y()
        }
    },

    // Alias for random.position()
    pos(): Point {
        return this.position()
    },

    // Random x coordinate inside screen
    x(): number {
        return this.range(screen.left, screen.right)
    },
    
    // Random y coordinate inside screen
    y(): number {
        return this.range(screen.bottom, screen.top)
    },
}

export function deg2rad(deg: number): number {
    return deg * Math.PI / 180
}

export function rad2deg(rad: number): number {
    return 180 * rad / Math.PI
}

export function sin(angle: number, unit: string = 'degrees'): number {
    if (unit === 'radians') {
        return Math.sin(angle)
    } else {
       return Math.sin(deg2rad(angle))
    }
}

export function cos(angle: number, unit: string = 'degrees'): number {
    if (unit === 'radians') {
        return Math.cos(angle)
    } else {
        return Math.cos(deg2rad(angle))
    }
}

export function tan(angle: number, unit: string = 'degrees'): number {
    if (unit === 'radians') {
        return Math.tan(angle)
    } else {
        return Math.tan(deg2rad(angle))
    }
}

export function atan2(y: number, x: number, unit: string = 'degrees'): number {
    if (unit === 'radians') {
        return Math.atan2(y, x)
    } else {
        return rad2deg(Math.atan2(y, x))
    }
}

// export function sqrt(n: number): number {
//     return Math.sqrt(n)
// }

// export function min(...args: number[]): number {
//     return Math.min(...args)
// }

// export function max(...args: number[]): number {
//     return Math.max(...args)
// }

// export function floor(n: number): number {
//     return Math.floor(n)
// }

// export function round(n: number): number {
//     return Math.round(n)
// }

export function clamp(value: number, min: number, max: number): number {
    if (value < min) {
        return min
    } else if (value > max) {
        return max
    } else {
        return value
    }
}

export const startCode = `setBackgroundColor('#00bd7e')

function bunnySpiral() {
    const growSpeed = 50
    const moveSpeed = 5
    const rotSpeed = 0.5

    every(0.1, () => {
        const bunny = new Sprite({
            src: 'https://pixijs.com/assets/bunny.png'
        })
        
        forever(delta => {
            bunny.x = cos(sqrt(bunny.age * 16) * moveSpeed, 'radians') * bunny.age / 4 * growSpeed
            bunny.y = sin(sqrt(bunny.age * 16) * moveSpeed, 'radians') * bunny.age / 4 * growSpeed
            bunny.rotation += 1 / (bunny.age + 1) * rotSpeed
            bunny.scale = sqrt(bunny.age / 12)
        })
    })
}

function rectSpiral() {
    const growSpeed = 40
    const moveSpeed = 1
    const rotSpeed = 1
    const colors = [
        '#F72585',
        '#7209B7',
        '#3A0CA3',
        '#F3A712',
        '#D6F8D6',
    ]
    let lastColor = ''
    let r = random(0, 4)
    // let i = 0
    
    every(0.1, () => {
        while (colors[r] === lastColor) r = random(0, 4)
        
        const rect = new Rectangle({
            color: colors[r]
        })
        lastColor = colors[r]
        // rect._rect.zIndex = i++
    
        forever(delta => {
            rect.x = cos(sqrt(rect.age * 16) * moveSpeed, 'radians') * rect.age / 4 * growSpeed
            rect.y = sin(sqrt(rect.age * 16) * moveSpeed, 'radians') * rect.age / 4 * growSpeed
            rect.rotation += sqrt(rect.age / 4) * rotSpeed / 2
            rect.scale = sqrt(rect.age / 12)
        })
    })
}

//// Example objects
const bunny = new Sprite({
    src: 'https://pixijs.com/assets/bunny.png',
    x: 200,
    cursor: 'question'
})
forever(delta => {
    if (keyJustPressed('F')) {
        bunny.rotation = 0
        repeatUntil(() => bunny.rotation == 360, i => {
            print(\`\${i}: \${bunny.rotation}\`)
        }).then(
            i => print(\`done \${i}: \${bunny.rotation}\`)
        )
    }
    bunny.rotation += 2
    // bunny.rotateAround(gator, 2).degrees()
})

const gator = new Sprite({
    src: 'https://woofjs.com/docs/images/river-gator.png',
	cursor: 'handOpen'
})
function spinGator() {
    if (gator.spinning) return
    gator.spinning = true
    
    repeat(45, () => {
        gator.rotation += 8
    }).then(() => {
        gator.spinning = false
        print('done')
    })
}
forever(delta => {
    if (keyPressed('W')) gator.y += 5
    if (keyPressed('A')) gator.x -= 5
    if (keyPressed('S')) gator.y -= 5
    if (keyPressed('D')) gator.x += 5
    if (keyPressed('Space')) spinGator()
    gator.x = clamp(gator.x, screen.leftX, screen.rightX)
    gator.y = clamp(gator.y, screen.bottomY, screen.topY)
    // if (gator.x > screen.rightX) { gator.x = screen.leftX }
    // if (gator.x < screen.leftX) { gator.x = screen.rightX }
    // if (gator.y > screen.topY) { gator.y = screen.bottomY }
    // if (gator.y < screen.bottomY) { gator.y = screen.topY }
})

const refSquare = new Sprite({
	src: 'src/assets/images/square.png',
	y: 300,
	cursor: 'handPoint'
})

// bunnySpiral()
// rectSpiral()

forever(delta => {
    if (keyPressed('Up')) camera.y += 5
    if (keyPressed('Down')) camera.y -= 5
    if (keyPressed('Left')) camera.x -= 5
    if (keyPressed('Right')) camera.x += 5
    if (keyPressed('R')) camera.goTo(0, 0)
})
`


/**
 * Monaco stuff
 */
// import { CodeEditor, useCodeEditor, type EditorOptions } from 'monaco-editor-vue3';
// import * as monaco from 'monaco-editor';
// import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
// import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

//   self.MonacoEnvironment = {
//     getWorker(_, label) {
//       if (label === 'json') {
//         return new jsonWorker()
//       }
//       if (label === 'css' || label === 'scss' || label === 'less') {
//         return new cssWorker()
//       }
//       if (label === 'html' || label === 'handlebars' || label === 'razor') {
//         return new htmlWorker()
//       }
//       if (label === 'typescript' || label === 'javascript') {
//         return new tsWorker()
//       }
//       return new editorWorker()
//     }
//   }

//   monaco.editor.create(document.getElementById('#code-container'), {
//     value: "function hello() {\n\talert('Hello world!');\n}",
//     language: 'javascript'
//   })
//   javascriptLanguage.data.of({
//     autocompletion: completions
//   })

// <!-- <CodeEditor
// v-model:value="code"
// language="javascript"
// theme="vs-dark"
// :options="editorOptions"
// /> -->


// function main() {
// 	const guy = new Sprite()
// 	// guy.x = 200
// 	// guy.y = 200
// 	guy.rotation = 90
// 	guy.rotationUnits = Units.RADIANS
// 	console.log(guy.rotationUnits)
// 	console.log(guy.rotation)
// 	// guy.src = 'https://woofjs.com/docs/images/B9v5lZJ.png'

// 	app.ticker.add((time) => {
// 		// Continuously rotate the container!
// 		// * use delta to create frame-independent transform *
// 		guy.x -= 0.1 * time.deltaMS
// 	});
// }

// (async () => {
// 	// Initialize the application
// 	await app.init({ background: '#ffffff', resizeTo: window });

// 	// Append the application canvas to the document body
// 	document.body.appendChild(app.canvas);

// 	main();

// 	// Load the bunny texture and initialize the sprite
// 	// const texture = await Assets.load('https://pixijs.com/assets/bunny.png');
// 	// const bunny = new PixiSprite(texture);

// 	// Add the sprite to the app stage
// 	// app.stage.addChild(bunny);

// 	// Move the bunny to the center
// 	// bunny.x = app.screen.width / 2;
// 	// bunny.y = app.screen.height / 2;

// 	// Center the bunny sprites in local container coordinates
// 	// bunny.pivot.x = bunny.width / 2;
// 	// bunny.pivot.y = bunny.height / 2;

// 	// bunny.rotation = 5 * 3.1416 / 4

// 	// Listen for animate update
// 	// app.ticker.add((time) => {
// 		// Continuously rotate the container!
// 		// * use delta to create frame-independent transform *
// 		// bunny.rotation -= 0.01 * time.deltaTime;
// 	// });
// })();

// Historical reference:
// function createGameAPI() {
//   return {
//     app,

//     async addSprite(url: string, x = 0, y = 0) {
//       const texture = await Pixi.Assets.load(url)
//       const sprite = new Pixi.Sprite(texture)

//       sprite.x = x
//       sprite.y = y

//       app.stage.addChild(sprite)

//       return sprite
//     },

//     addText(text: string, x = 0, y = 0) {
//       const label = new Pixi.Text({ text })

//       label.x = x
//       label.y = y

//       app.stage.addChild(label)

//       return label
//     },

//     forever(fn: Function) {
//       app.ticker.add((time) => {
//         fn()
//       })
//     },

//     clear() {
//       app.stage.removeChildren()
//     }
//   }
// }

// // Mixins
// type Class = new (...args: any[]) => any

// function PositionableMixin<Base extends Class>(base: Base) {
// 	return class extends base {
// 		_x: number = 0
// 		_y: number = 0
// 		x: number = 0
// 		y: number = 0
// 		screenX: number = 0
// 		screenY: number = 0
// 		get x():
// 		_updatePosition: Function = () => {

// 		}
// 	}
// }
