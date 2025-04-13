import { Renderer } from "./renderer";

interface CanvasSizerState {
    canvas: HTMLCanvasElement;
    container: HTMLElement;
    renderer: Renderer;
    resizeObserver: ResizeObserver;
}

export interface CanvasSizer {
    start(): void;
    dispose(): void;
}

export function createCanvasSizer(
    canvas: HTMLCanvasElement,
    container: HTMLElement,
    renderer: Renderer
): CanvasSizer {
    const state: CanvasSizerState = {
        canvas,
        container,
        renderer,
        resizeObserver: new ResizeObserver((entries) => handleResize(entries, state))
    };

    return {
        start: () => start(state),
        dispose: () => dispose(state)
    };
}

function handleResize(entries: ResizeObserverEntry[], state: CanvasSizerState) {
    entries.forEach((entry) => {
        if (entry.target != state.container) {
            // Nothing to do.
            return;
        }
        const { width, height } = entry.contentRect;

        state.canvas.width = width * window.devicePixelRatio;
        state.canvas.height = height * window.devicePixelRatio;

        // TODO: Would need to resize various buffers presumably?
        // state.renderer?.resizeBackings();
    });
}

function initialResize(state: CanvasSizerState) {
    state.canvas.width = state.container.clientWidth * window.devicePixelRatio;
    state.canvas.height = state.container.clientHeight * window.devicePixelRatio;
}

function start(state: CanvasSizerState) {
    initialResize(state);
    state.resizeObserver.observe(state.container);
}

function dispose(state: CanvasSizerState) {
    state.resizeObserver.unobserve(state.container);
}