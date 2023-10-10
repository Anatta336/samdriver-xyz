/**
 * @typedef {Object} Input
 * @property {number} deadzone
 * @property {function(): number} getLeftStickX
 * @property {function(): number} getLeftStickY
 */

/**
 * @param {number} deadzone If using a gamepad, input before it starts registering.
 *
 * @returns {Input}
 */
export default (
    deadzone = 0.05,
) => {
    let hasActivePad = false;
    let activePadIndex = 0;

    let buttonLeft = false;
    let buttonRight = false;
    let buttonUp = false;
    let buttonDown = false;

    let bindings = {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        up: 'ArrowUp',
        down: 'ArrowDown',
    };

    // TODO: Add support for multiple gamepads
    window.addEventListener('gamepadconnected', connectedEvent => {
        hasActivePad = true;
        activePadIndex = connectedEvent.gamepad.index;
    });

    window.addEventListener('gamepaddisconnected', disconnectedEvent => {
        if (disconnectedEvent.gamepad.index === activePadIndex) {
            hasActivePad = false;
            activePadIndex = 0;
        }
    });

    window.addEventListener('keydown', keyDownEvent => {
        switch (keyDownEvent.key) {
            case bindings.left:
                buttonLeft = true;
                break;
            case bindings.right:
                buttonRight = true;
                break;
            case bindings.up:
                buttonUp = true;
                break;
            case bindings.down:
                buttonDown = true;
                break;
        }
        keyDownEvent.preventDefault();
    });

    window.addEventListener('keyup', keyUpEvent => {
        switch (keyUpEvent.key) {
            case bindings.left:
                buttonLeft = false;
                break;
            case bindings.right:
                buttonRight = false;
                break;
            case bindings.up:
                buttonUp = false;
                break;
            case bindings.down:
                buttonDown = false;
                break;
        }
        keyUpEvent.preventDefault();
    });

    return {
        deadzone,
        getLeftStickX,
        getLeftStickY,
    };

    function getGamePad() {
        if (!hasActivePad) {
            return null;
        }

        return navigator.getGamepads()[activePadIndex];
    }

    function getLeftStickX() {
        // Keyboard input takes precedence.
        if (buttonLeft) {
            return -1.0;
        }
        if (buttonRight) {
            return 1.0;
        }

        const raw = getGamePad()?.axes[0] ?? 0.0;
        if (Math.abs(raw) < deadzone) {
            return 0.0;
        }
        return raw;
    }

    function getLeftStickY() {
        // Keyboard input takes precedence.
        if (buttonUp) {
            return -1.0;
        }
        if (buttonDown) {
            return 1.0;
        }

        const raw = getGamePad()?.axes[1] ?? 0.0;
        if (Math.abs(raw) < deadzone) {
            return 0.0;
        }
        return raw;
    }
};
