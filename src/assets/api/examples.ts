// type exampleFileName = 'main.js' | 'sprites.js' | 'rectangles.js' | 'lines.js' | 'labels.js'


const mainJs = `// This is main.js`
const spritesJs = '// This is sprites.js'
const rectanglesJs = '// This is rectangles.js'
const linesJs = '// This is lines.js'
const labelsJs = '// This is labels.js'
const inputJs = 
`setBackgroundColor('#8b3a5b')

const rectLShift = new Rectangle({
    x: -160,
    width: 120,
    height: 60,
})
const rectLShiftActive = new Rectangle({
    x: -160,
    width: 120,
    height: 60,
    color: Colors.Peru,
    visible: false
})
const textLShift = new Label({
    x: -160,
    text: 'L shift',
    color: '#000'
})

const rectRShift = new Rectangle({
    x: 160,
    width: 120,
    height: 60,
})
const rectRShiftActive = new Rectangle({
    x: 160,
    width: 120,
    height: 60,
    color: Colors.Peru,
    visible: false
})
const textRShift = new Label({
    x: 160,
    text: 'R shift',
    color: '#000'
})

const rectCShift = new Rectangle({
    width: 120,
    height: 60,
})
const rectCShiftActive = new Rectangle({
    width: 120,
    height: 60,
    color: Colors.Peru,
    visible: false
})
const textCShift = new Label({
    text: 'Shift',
    color: '#000'
})

const rectLCtrl = new Rectangle({
    x: -120,
    y: -80,
    width: 90,
    height: 60,
})
const rectLCtrlActive = new Rectangle({
    x: -120,
    y: -80,
    width: 90,
    height: 60,
    color: Colors.Peru,
    visible: false
})
const textLCtrl = new Label({
    x: -120,
    y: -80,
    text: 'L ctrl',
    color: '#000'
})

const rectRCtrl = new Rectangle({
    x: 120,
    y: -80,
    width: 90,
    height: 60,
})
const rectRCtrlActive = new Rectangle({
    x: 120,
    y: -80,
    width: 90,
    height: 60,
    color: Colors.Peru,
    visible: false
})
const textRCtrl = new Label({
    x: 120,
    y: -80,
    text: 'R ctrl',
    color: '#000'
})

const rectCCtrl = new Rectangle({
    y: -80,
    width: 90,
    height: 60,
})
const rectCCtrlActive = new Rectangle({
    y: -80,
    width: 90,
    height: 60,
    color: Colors.Peru,
    visible: false
})
const textCCtrl = new Label({
    y: -80,
    text: 'Ctrl',
    color: '#000'
})

forever(delta => {
    rectLShift.color = keyPressed('ShiftLeft') ? Colors.MediumSeaGreen : Colors.Gray
    rectRShift.color = keyPressed('ShiftRight') ? Colors.MediumSeaGreen : Colors.Gray
    rectCShift.color = keyPressed('Shift') ? Colors.MediumSeaGreen : Colors.Gray

    rectLCtrl.color = keyPressed('CtrlLeft') ? Colors.MediumSeaGreen : Colors.Gray
    rectRCtrl.color = keyPressed('CtrlRight') ? Colors.MediumSeaGreen : Colors.Gray
    rectCCtrl.color = keyPressed('Ctrl') ? Colors.MediumSeaGreen : Colors.Gray
})

onKeyPress({
    ShiftLeft: () => {
        rectLShiftActive.show()
        after(0.12, () => rectLShiftActive.hide())
    },
    ShiftRight: () => {
        rectRShiftActive.show()
        after(0.12, () => rectRShiftActive.hide())
    },
    Shift: () => {
        rectCShiftActive.show()
        after(0.12, () => rectCShiftActive.hide())
    },
    CtrlLeft: () => {
        rectLCtrlActive.show()
        after(0.12, () => rectLCtrlActive.hide())
    },
    CtrlRight: () => {
        rectRCtrlActive.show()
        after(0.12, () => rectRCtrlActive.hide())
    },
    Ctrl: () => {
        rectCCtrlActive.show()
        after(0.12, () => rectCCtrlActive.hide())
    },
})`

const rectSpiralJs = 
`setBackgroundColor('#00bd7e')
const growSpeed = 40
const moveSpeed = 1
const rotSpeed = 1
const colors = [
    '#f72585',
    '#7209b7',
    '#3a0ca3',
    '#f3a712',
    '#d6f8d6',
]
let lastColor = ''
let r = Random.integer(0, 4)
// let i = 0

every(0.1, () => {
    while (colors[r] === lastColor) r = Random.integer(0, 4)
    
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
})`

const solarSystemJs =
`// Welcome to Sunsprite!
//
// This is a tiny solar system you can play with, built entirely from the
// Sunsprite API. Change any number you like and the game restarts with it.
// The Docs panel explains everything used here.
//
// Click the game first so it hears the keyboard, then:
//
//   Arrow keys / WASD ..... fly the comet (hold Shift to turn slowly)
//   Space ................. boost
//   C ..................... make the camera follow the comet, or stop
//   Click empty space ..... add a planet
//   Drag the sun .......... its planets come along
//   Double-click the sun .. change its color
//   Click a planet ........ select it
//   Scroll on a planet .... resize it
//   Right-click a planet .. drop it into the sun

Background.color = '#0b1026'
const WORLD = 1000 // How far the playfield stretches from the center


// ---- Stars ------------------------------------------------------------------

const stars = []
for (let i = 0; i < 160; i++) {
    stars.push(new Circle({
        x: Random.number(-WORLD, WORLD),
        y: Random.number(-WORLD, WORLD),
        radius: Random.number(0.5, 2),
        color: Colors.White,
        alpha: Random.number(0.2, 0.8),
        layer: -10, // Lower layers are drawn behind higher ones
    }))
}

// Every 50ms, one random star changes brightness
every(0.05, () => {
    Random.choice(stars).alpha = Random.number(0.1, 1)
})


// ---- The sun ----------------------------------------------------------------

const sunColors = [Colors.Gold, Colors.OrangeRed, Colors.LightSkyBlue, Colors.Violet]
let sunColorIndex = 0

const glow = new Circle({ radius: 70, color: Colors.Gold, alpha: 0.15, layer: 4 })

const sun = new Circle({
    radius: 44,
    color: Colors.Gold,
    outlineColor: Colors.Orange,
    outlineWidth: 6,
    layer: 5,
    draggable: true,
    cursor: 'hand_open.cur',
    onDrag: (x, y) => sun.goTo(x, y),
    onDragStart: () => sun.cursor = 'hand_closed.cur',
    onDragEnd: () => sun.cursor = 'hand_open.cur',
    onDoubleClick: () => {
        sunColorIndex = (sunColorIndex + 1) % sunColors.length
        sun.color = sunColors[sunColorIndex]
        glow.color = sun.color
    },
})

// forever() runs its function once every frame
forever(() => {
    glow.position = sun.position
    glow.scale = 1 + sin(Clock.time * 90) * 0.08 // Gently pulse, one beat every 4 seconds
})


// ---- Planets ----------------------------------------------------------------

const planetColors = [Colors.Tomato, Colors.MediumAquamarine, Colors.CornflowerBlue, Colors.Orchid, Colors.SandyBrown]
const planets = []
let selected = null
let hovered = null

// One name tag, moved to whichever planet the mouse is over
const tag = new Label({ text: '', size: 16, color: Colors.White, layer: 20, visible: false })

// A Line's endpoints can be functions. It calls them every frame to stay attached.
const beam = new Line({
    pointA: () => sun.position,
    pointB: () => selected ? selected.body.position : sun.position,
    color: Colors.White,
    thickness: 2,
    alpha: 0.4,
    layer: 1,
})

function randomName() {
    return Random.letter(true) + Random.char('aeiou') + Random.char('lmnrstvz') + Random.char('aeiou') + '-' + Random.integer(1, 99)
}

function addPlanet(x, y) {
    if (planets.length >= 12) {
        Output.warn('This system is full! Right-click a planet to drop it into the sun.')
        return
    }

    // Where the planet sits relative to the sun. Rotating this vector is what makes it orbit.
    const offset = new Vector2(x - sun.x, y - sun.y)

    // A faint ring tracing the orbit: just an outline, with the fill cleared
    const ring = new Circle({ radius: offset.length, outlineColor: Colors.White, outlineWidth: 1, outlineAlpha: 0.15, layer: -5 })
    ring.clearFill()

    const body = new Circle({
        radius: Random.integer(8, 18),
        color: Random.choice(planetColors),
        cursor: 'hand_point.cur',
        scale: 0.05,
    })

    const planet = {
        body,
        ring,
        offset,
        name: randomName(),
        speed: 1100 / offset.length ** 1.5, // Closer planets orbit faster, like real ones
    }
    planets.push(planet)

    // Pop in: grow to full size over 20 frames
    repeat(20, i => body.scale = (i + 1) / 20)

    // onMouse() sets up several mouse events at once
    const inOrbit = () => planets.includes(planet)
    body.onMouse({
        Enter: () => { if (inOrbit()) hovered = planet },
        Exit: () => { if (hovered === planet) hovered = null },
        LeftClick: () => {
            if (!inOrbit()) return
            if (selected) selected.body.clearOutline()
            selected = selected === planet ? null : planet
            if (selected) selected.body.setOutline(Colors.White, 3)
        },
        RightClick: () => { if (inOrbit()) dropIntoSun(planet) },
        Scroll: (x, y) => body.radius = clamp(body.radius + (y > 0 ? 2 : -2), 5, 40),
    })
}

function dropIntoSun(planet) {
    planets.splice(planets.indexOf(planet), 1)
    planet.ring.hide()
    if (selected === planet) selected = null
    if (hovered === planet) hovered = null

    // Spiral inward every frame until it reaches the sun, then disappear
    repeatUntil(() => planet.offset.length < sun.radius, () => {
        planet.offset.rotate(planet.speed * 4)
        planet.offset.set(planet.offset.x * 0.96, planet.offset.y * 0.96)
        planet.body.goTo(sun.x + planet.offset.x, sun.y + planet.offset.y)
    }).then(() => {
        planet.body.hide()
        print(planet.name + ' fell into the sun!')
    })
}

addPlanet(110, 0)
addPlanet(-170, 40)
addPlanet(0, -220)

forever(() => {
    for (const planet of planets) {
        planet.offset.rotate(planet.speed)
        planet.body.goTo(sun.x + planet.offset.x, sun.y + planet.offset.y)
        planet.ring.position = sun.position
    }

    tag.visible = hovered !== null
    if (hovered) {
        tag.text = hovered.name
        // An anchor picks which point of the object lands on the position: here
        // the tag's bottom center goes just above the planet's top edge
        tag.goTo([hovered.body.x, hovered.body.top + 6], 'bottomCenter')
    }
})

// The global onMouse() hears every click, even ones on top of objects,
// so only add a planet if the spot is empty
onMouse({
    LeftClick: (x, y) => {
        const onSomething = sun.distanceTo(x, y) < sun.width / 2 + 20
            || planets.some(p => p.body.distanceTo(x, y) < p.body.width / 2 + 4)
        if (!onSomething) addPlanet(x, y)
    },
})


// ---- The comet --------------------------------------------------------------

const comet = new Rectangle({
    x: -120,
    y: Screen.bottom + 50, // Near the bottom of the screen, whatever its size
    width: 26,
    height: 12,
    cornerRadius: 6,
    color: Colors.White,
    outlineColor: Colors.Cyan,
    outlineWidth: 2,
    rotation: 15, // Degrees, counterclockwise from pointing right
    layer: 10,
})
const velocity = new Vector2(0, 0)

function turn(direction) {
    comet.rotate(direction * (keyPressed('Shift') ? 1.5 : 4))
}
function thrust(amount) {
    velocity.x += comet.direction.x * amount
    velocity.y += comet.direction.y * amount
}

// onKeyHold() runs every frame while a key is held, onKeyPress() once per press
onKeyHold({
    Left: () => turn(1),
    A: () => turn(1),
    Right: () => turn(-1),
    D: () => turn(-1),
    Up: () => thrust(0.2),
    W: () => thrust(0.2),
    Down: () => thrust(-0.1),
    S: () => thrust(-0.1),
})

// An expanding ring for the boost, kept hidden until needed
const shockwave = new Circle({ radius: 10, outlineColor: Colors.Cyan, outlineWidth: 3, visible: false, layer: 8 })
shockwave.clearFill()

onKeyPress({
    Space: () => {
        thrust(8)
        shockwave.goTo(comet)
        shockwave.show()
        repeat(20, i => {
            shockwave.radius = 10 + i * 4
            shockwave.alpha = 1 - i / 20
        }).then(() => shockwave.hide())
    },
})

// The delta passed to forever() is about 1 at 60fps, so motion stays smooth at any frame rate
forever(delta => {
    comet.x += velocity.x * delta
    comet.y += velocity.y * delta
    velocity.set(velocity.x * 0.985, velocity.y * 0.985) // Space dust slows it down a little

    // Fly off one edge, come back on the opposite one
    if (comet.x > WORLD) comet.x = -WORLD
    if (comet.x < -WORLD) comet.x = WORLD
    if (comet.y > WORLD) comet.y = -WORLD
    if (comet.y < -WORLD) comet.y = WORLD
})

// when() runs once each time its condition turns true
when(() => comet.distanceTo(sun) < sun.width / 2 + 8, () => {
    const away = new Vector2(comet.x - sun.x, comet.y - sun.y).normal
    velocity.set(away.x * 6, away.y * 6)
    sun.color = Colors.White
    after(0.15, () => sun.color = sunColors[sunColorIndex])
    print('Ouch, too hot!')
})

// The trail is a fixed set of puffs, each recycled to the comet's tail in turn
const trail = []
for (let i = 0; i < 40; i++) {
    trail.push(new Circle({ radius: 5, color: Colors.Cyan, alpha: 0, layer: 9 }))
}
let nextPuff = 0

forever(() => {
    if (velocity.length > 0.5) {
        const puff = trail[nextPuff]
        nextPuff = (nextPuff + 1) % trail.length
        puff.goTo(comet.x - comet.direction.x * 12, comet.y - comet.direction.y * 12)
        puff.color = velocity.length > 10 ? Colors.Gold : Colors.Cyan
        puff.alpha = min(velocity.length / 10, 0.8)
        puff.scale = 1
    }
    for (const puff of trail) {
        puff.alpha *= 0.92
        puff.scale *= 0.95
    }
})


// ---- Camera -----------------------------------------------------------------

let following = false

onKeyPress({
    C: () => {
        following = !following
        if (following) Camera.follow(comet)
        else Camera.stopFollow()
    },
})

// While not following the comet, glide back to the center
forever(() => {
    if (!following) {
        Camera.x *= 0.92
        Camera.y *= 0.92
    }
})


// ---- Title, output, and watch panel ----------------------------------------

const title = new Label({ text: 'Sunsprite', size: 48, color: Colors.Gold, layer: 20 })
title.goTo([0, Screen.top - 24], 'topCenter') // Top center 24px below the top of the screen
const subtitle = new Label({ text: 'Fly with the arrow keys. Click to add planets.', size: 18, color: Colors.White, layer: 20 })
subtitle.goTo([0, title.bottom - 8], 'topCenter')

// Fade out after a few seconds
after(5, () => {
    repeat(60, i => {
        title.alpha = 1 - (i + 1) / 60
        subtitle.alpha = title.alpha
    }).then(() => {
        title.hide()
        subtitle.hide()
    })
})

print('Welcome to Sunsprite! The controls are listed at the top of main.js.')

// watch() shows live values in the Watch panel
watch('Comet', {
    speed: () => velocity.length,
    position: () => round(comet.x) + ', ' + round(comet.y),
    'camera following': () => following,
})
watch('Planets', {
    count: () => planets.length,
    selected: () => selected ? selected.name : 'none',
})

// Next steps: add your own images and sounds in the file tree, then use them with
// new Sprite({ src: 'player.png' }) and new Sound({ src: 'jump.mp3' })`

const exampleCode: { [key: string]: string } = {
    'main.js': solarSystemJs,
    'sprites.js': spritesJs,
    'rectangles.js': rectanglesJs,
    'lines.js': linesJs,
    'labels.js': labelsJs,
    'rectSpiral.js': rectSpiralJs,
    'input.js': inputJs,
}

export function getExampleCode(fileName: string = 'main.js'): string {
    return exampleCode[fileName] ?? `/* Example code not found for ${fileName} */`
}

export const exampleScriptNames = Object.keys(exampleCode)


// from examples.js:
/* Star Catcher
setBackgroundImage('https://woofjs.com/docs/images/galaxy.jpg')

const scoreLabel = new Text({
    text: 'Score: 0',
    color: 'white',
    outline: {
        color: 'black',
        width: 4
    },
    x: screen.left + 60,
    y: screen.top - 20
})
const timerLabel = new Text({
    text: 'Time: 20',
    color: 'white',
    outline: {
        color: 'black',
        width: 4
    },
    x: screen.right - 60,
    y: screen.top - 20
})
const endLabel = new Text({
    text: 'GAME OVER',
    color: 'white',
    outline: {
        color: 'black',
        width: 5
    },
    size: 80,
    layer: 1,
    visible: false
})

let score = 0
let time = 31
let gameOver = false

every(1, () => {
    if (gameOver) return
    time -= 1
    timerLabel.text = `Time: ${time}`
    if (time <= 0) {
        gameOver = true
        endLabel.show()
    }
})

const star = new Sprite({
    src: 'https://woofjs.com/docs/images/rr-star.png',
    cursor: 'handPoint',
    onClick: () => {
        if (gameOver) return
        star.goToRandom()
        star.scale = randomFloat(0.25, 1.75)
        score += 1
        scoreLabel.text = `Score: ${score}`
    }
})
*/

/* Hungry Crab
setBackgroundImage('https://woofjs.com/docs/images/ocean.jpg')

const crab = new Sprite({
    src: 'https://woofjs.com/docs/images/crab.png'
})
const fish = new Sprite({
    src: 'https://woofjs.com/docs/images/fish.png',
    scale: 0.5,
    // rotation: 45
})
fish.goToRandom()

const scoreLabel = new Text({
    text: 'Score: 0',
    x: screen.left + 60,
    y: screen.top - 20
})
const timerLabel = new Text({
    text: 'Time: 20',
    x: screen.right - 60,
    y: screen.top - 20
})

let score = 0
let time = 31
let gameOver = false

every(1, () => {
    if (gameOver) return
    time -= 1
    timerLabel.text = `Time: ${time}`
    if (time === 0) gameOver = true
})

forever(delta => {
    if (gameOver) return
    if (keyPressed('w')) crab.y += 5
    if (keyPressed('a')) crab.x -= 5
    if (keyPressed('s')) crab.y -= 5
    if (keyPressed('d')) crab.x += 5
    
    if (keyPressed('up')) camera.y += 5
    if (keyPressed('left')) camera.x -= 5
    if (keyPressed('down')) camera.y -= 5
    if (keyPressed('right')) camera.x += 5
    
    if (crab.x < screen.left) crab.x = screen.right
    if (crab.x > screen.right) crab.x = screen.left
    if (crab.y < screen.bottom) crab.y = screen.top
    if (crab.y > screen.top) crab.y = screen.bottom

    if (crab.touching(fish)) {
        score += 1
        scoreLabel.text = `Score: ${score}`
        fish.goToRandom()
    }
})
*/