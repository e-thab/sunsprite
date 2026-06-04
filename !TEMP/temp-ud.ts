import { chromium } from 'playwright';
import fs from 'node:fs';


async function getUdWords() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    const startingWith = 'A'
    await page.goto(`https://www.urbandictionary.com/browse.php?character=${startingWith}`);

    let words = ''
    // const items = await page.locator('.px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-denim hover:text-white transition truncate border-b border-r border-gray-100 dark:border-gray-700').allInnerTexts()
    const items = await page.locator('.px-4.py-2.text-sm').allInnerTexts()
    for (let item of items) {
        words += item + '\n'
    }

    fs.writeFile('words.txt', words, (err: any) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('File created successfully!');
    });

    await context.close();
    await browser.close();
}

// // Go to Hacker News
// async function get6LetterWords(startingWith: string) {
//     await page.goto(`https://www.urbandictionary.com/browse.php?character=${startingWith}`);

//     let nextButton = page.getByLabel('Next page')
//     while (nextButton) {
//         const collection = document.getElementsByClassName('px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-denim hover:text-white transition truncate border-b border-r border-gray-100 dark:border-gray-700')
//         const items = page.locator('')
//         let words = []
//         for (let element of collection) {
//             const word = element.innerText.replaceAll('\\', '').replaceAll(' ', '').toUpperCase()
//             if (word.length === 6) words.push(word)
//         }
//         nextButton.click()
//         nextButton = page.getByLabel('Next page')
//     }
// }
// }

// for (let letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    
// }



// await page.goto(`https://www.urbandictionary.com/browse.php?character=A`)
// let nextButton = page.getByLabel('Next page')

// const collection = document.getElementsByClassName('px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-denim hover:text-white transition truncate border-b border-r border-gray-100 dark:border-gray-700')


// for (let element of collection) {
//     const word = element.innerText.replaceAll('\\', '').replaceAll(' ', '').toUpperCase()
//     if (word.length === 6) words += word
// }

await getUdWords();
