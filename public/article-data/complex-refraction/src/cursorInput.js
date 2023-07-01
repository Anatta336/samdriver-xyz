export default () => {
    const isDown = {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        ArrowDown: false,
    };

    window.addEventListener('keydown', keydownEvent => {
        if (keydownEvent.code in isDown) {
            isDown[keydownEvent.code] = true;
            keydownEvent.preventDefault();
        }
    });

    window.addEventListener('keyup', keyupEvent => {
        if (keyupEvent.code in isDown) {
            isDown[keyupEvent.code] = false;
            keyupEvent.preventDefault();
        }
    });

    return {
        getHorizontal,
        getVertical,
    };

    function getHorizontal() {
        return (isDown.ArrowRight ? 1.0 : 0.0) - (isDown.ArrowLeft ? 1.0 : 0.0);
    }
    function getVertical() {
        return (isDown.ArrowUp ? 1.0 : 0.0) - (isDown.ArrowDown ? 1.0 : 0.0);
    }
};
