import { _projectTextFile } from '@api/assets'

/** The name of a text file in your project as a string. */
export type TextSource = string

/** Used to get data from files in your project. */
const Files = {
    /**
     * Returns everything in a text file in your project, like 'level1.txt', as one string. The
     * file is read as it was when the game started. If there's no text file with that name, shows
     * a warning and returns an empty string.
     * @param name The text file's name exactly as it appears in the file tree (case-senstiive).
     */
    read(name: TextSource): string {
        const content = _projectTextFile(name)
        if (!content) throw new Error(`No text file found with the name ${name}`)
        return content
    },

    /**
     * Returns lines in a text file as an array of strings. Each line is an entry in the array.
     * @param name The text file's name exactly as it appears in the file tree (case-sensitive).
     */
    readLines(name: TextSource): string[] {
        const content = _projectTextFile(name)
        if (!content) throw new Error(`No text file found with the name ${name}`)
        return content.split('\n')
    }
}

export default Files
