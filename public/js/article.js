/**
 * Article page interactions.
 *
 * - Following the drive bay link powers the screen down and slides the disk
 *   out before navigating.
 *
 * Without this script the page is fully readable and the bay link still works.
 */
(() => {
    'use strict';

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

    // ------------------------------------------------------------------
    // Eject: power the monitor down, then leave.
    // ------------------------------------------------------------------
    const bay = document.querySelector('a.eject-bay');

    bay?.addEventListener('click', (e) => {
        if (reducedMotion.matches || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
            return; // plain navigation
        }
        if (document.body.classList.contains('is-ejecting')) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        document.body.classList.add('is-ejecting');
        setTimeout(() => { location.href = bay.href; }, 420);
    });

    // Returning via the back/forward cache: power the screen back up.
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            document.body.classList.remove('is-ejecting');
        }
    });
})();
