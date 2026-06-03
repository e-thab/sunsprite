export function getExampleCode(fileName: string): string {
    if (fileName === 'main.js') {
        const localCode = localStorage.getItem('code')
        return localCode ?? '/* ... */'
    }

    const code = exampleCode[fileName]
    return code ?? ''
}

const exampleCode: { [key: string]: string } = {
    'sprites.js': `// This is sprites.js
    `,

    'rectangles.js': `// This is rectangles.js
    `,

    'lines.js': `// This is lines.js
    `,

    'labels.js': `// This is labels.js
    `,
}



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