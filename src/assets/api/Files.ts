import { _projectTextFile } from '@api/assets'

/** The name of a text file in your project as a string. */
export type TextSource = string

/**
 * Reads the files in your project.
 */
const Files = {
    /**
     * Returns everything in a text file in your project, like 'level1.txt', as one string. The
     * file is read as it was when the game started. If there's no text file with that name, shows
     * a warning and returns an empty string.
     * @param name The text file's name exactly as it appears in the file tree (case-senstiive).
     */
    read(name: TextSource): string | undefined {
        return _projectTextFile(name)
    },

    /**
     * Returns lines in a text file as an array of strings. Each line is an entry in the array.
     * @param name The text file's name exactly as it appears in the file tree (case-sensitive).
     */
    readLines(name: TextSource): string[] | undefined {
        const content = this.read(name)
        if (content) {
            return content.split('\n')
        }
        return undefined
    }
}

export default Files
