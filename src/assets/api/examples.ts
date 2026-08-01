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
let r = Random.range(0, 4)
// let i = 0

every(0.1, () => {
    while (colors[r] === lastColor) r = Random.range(0, 4)
    
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

const exampleCode: { [key: string]: string } = {
    'main.js': mainJs,
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