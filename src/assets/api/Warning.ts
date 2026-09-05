/**
 * Thrown by user code to flag a problem without the fatal-looking treatment
 * of a real Error — an uncaught Warning is caught the same way any other
 * throw is (see core.ts's reportUserError), but shown in the output panel
 * styled as a warning instead of an error, with its line (recovered from the
 * stack trace, same as a thrown Error) highlighted in the theme's warning
 * color rather than its error color.
 */
export default class Warning extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'Warning'
    }
}
