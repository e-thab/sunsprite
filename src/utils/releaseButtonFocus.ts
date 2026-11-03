/**
 * Click handler for a toolbar around the running game: hands focus back after
 * a mouse click on any of its buttons. A button keeps focus after a mouse
 * press, and Space/Enter on a focused button re-clicks it, so without this,
 * pressing Space for the game (e.g. jump) right after clicking Restart would
 * restart it again. Once blurred, the app's body has focus and hostBridge.ts
 * forwards the keys to the game instead.
 *
 * Meant to sit on the toolbar container, so it catches every button inside it
 * as the click bubbles up, after the button's own handler has run.
 *
 * Keyboard activation (detail 0) keeps focus where it is, so tabbing through
 * the toolbar still works. A button whose click already moved focus elsewhere
 * (a popover trigger focusing its content) isn't the active element anymore
 * and is left alone.
 */
export function releaseButtonFocus(event: MouseEvent) {
    if (event.detail === 0) return
    const button = (event.target as Element | null)?.closest('button')
    if (button && document.activeElement === button) button.blur()
}
