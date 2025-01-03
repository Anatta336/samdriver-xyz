export default (
    deadzone = 0.05,
) => {
    let hasActivePad = false;
    let activePadIndex = 0;

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
        const raw = getGamePad()?.axes[0] ?? 0.0;
        if (Math.abs(raw) < deadzone) {
            return 0.0;
        }
        return raw;
    }

    function getLeftStickY() {
        const raw = getGamePad()?.axes[1] ?? 0.0;
        if (Math.abs(raw) < deadzone) {
            return 0.0;
        }
        return raw;
    }
};
