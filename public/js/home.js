/**
 * Floppy disk interactions for the home page.
 *
 * - Click/tap a disk to pick it up (raised above the surface, LOAD button shown).
 * - Click LOAD, or drag the disk into the drive slot, to open its article.
 * - Mouse users can drag any disk directly; touch users pick a disk up first
 *   (so vertical page scrolling keeps working on the disk field).
 *
 * Without this script every disk is still a plain working link.
 */
(() => {
    'use strict';

    const drive = document.querySelector('.drive');
    const drivePlate = drive?.querySelector('.drive-plate');
    const slotOpening = drive?.querySelector('.slot-opening');
    const disks = document.querySelectorAll('a.disk');
    if (!drive || !drivePlate || !slotOpening || disks.length === 0) {
        return;
    }

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

    let raisedDisk = null;
    let suppressClick = false;
    let inserting = false;

    /**
     * Resolve each disk's entrance start point (the disk-deal keyframes in
     * home.css) into a pixel offset from where it has landed in the grid.
     *
     * The seed vars set by the server say where along the top edge of the view
     * the disk comes in (--deal-fx) and how far beyond it (--deal-drop); only
     * here is the disk's own position known, and it is what the offset has to
     * be measured against. Off the top of the *view* rather than of the page,
     * so a disk below the fold crosses the screen rather than starting in the
     * middle of it.
     *
     * Every rect and var is read before anything is written: interleaving the
     * two would flush layout once per disk.
     */
    const dealDisks = () => {
        const starts = [...disks].map((disk) => {
            const style = getComputedStyle(disk);
            return {
                rect: disk.getBoundingClientRect(),
                fx: parseFloat(style.getPropertyValue('--deal-fx')) || 0.5,
                drop: parseFloat(style.getPropertyValue('--deal-drop')) || 60,
            };
        });

        disks.forEach((disk, i) => {
            const { rect, fx, drop } = starts[i];
            const startX = fx * innerWidth - rect.width / 2;
            const startY = -(rect.height + drop);
            disk.style.setProperty('--deal-x', `${startX - rect.left}px`);
            disk.style.setProperty('--deal-y', `${startY - rect.top}px`);
        });
    };

    if (!reducedMotion.matches) {
        dealDisks();
    }

    const raise = (disk) => {
        if (raisedDisk && raisedDisk !== disk) {
            lower(raisedDisk);
        }
        disk.classList.add('is-raised');
        raisedDisk = disk;
    };

    const lower = (disk) => {
        disk.classList.remove('is-raised');
        if (raisedDisk === disk) {
            raisedDisk = null;
        }
    };

    /**
     * Take the drive apart for the length of an insert, into three layers a
     * disk can pass between. The dividing line is the bottom of the slot
     * opening: below it the plate is the drive's front face and stays in
     * front of the disk; above it — the lip, the slot's upper bezel and the
     * black opening itself — is backdrop, and goes behind. Between the two
     * sits the shadow inside the slot, so a disk on its way in reads as
     * sinking into the drive rather than passing behind it.
     *
     * Every layer sits on the drive and none of them move, so their clips
     * are static and line up whatever the disk is doing. Measured per insert
     * rather than cached: the drive is fixed, so it cannot move mid-insert,
     * but it does move between them (a resize, or the 760px breakpoint
     * switching it from centred to docked).
     */
    let driveLayers = [];
    const splitDriveFace = () => {
        healDriveFace();
        const plate = drivePlate.getBoundingClientRect();
        const opening = slotOpening.getBoundingClientRect();
        // Rounded so the plate's clip edge lands on a whole pixel: a
        // fractional edge is antialiased, which half-paints the row it
        // falls on and draws a hairline across the drive's face.
        const faceTop = Math.round(opening.bottom - plate.top);

        // A clone rather than a hand-copied background: the backdrop holds
        // the top screws, the slot's bezel and the opening as well as the
        // plate's gradient, and a copy that missed any of them would show up
        // as the drive losing parts of itself for the length of the insert.
        const backdrop = document.createElement('div');
        backdrop.className = 'drive-backdrop';
        backdrop.inert = true;
        backdrop.appendChild(drivePlate.cloneNode(true));
        backdrop.style.left = `${plate.left}px`;
        backdrop.style.top = `${plate.top}px`;
        backdrop.style.width = `${plate.width}px`;
        backdrop.style.clipPath = `inset(-60px -60px calc(100% - ${faceTop}px) -60px)`;

        // The dark of the slot, laid over the disk rather than under it.
        const shadow = document.createElement('div');
        shadow.className = 'slot-shadow';
        shadow.style.left = `${opening.left}px`;
        shadow.style.top = `${opening.top}px`;
        shadow.style.width = `${opening.width}px`;
        shadow.style.height = `${opening.height}px`;

        // Deliberately not inside aside.drive: a fixed element is always a
        // stacking context, so a child of the drive could never paint below
        // a disk that sits outside it, whatever its z-index. Being outside
        // also keeps the clone clear of the drive's own state selectors, so
        // it never picks up the blinking LED.
        driveLayers = [backdrop, shadow];
        document.body.append(backdrop, shadow);

        drive.style.setProperty('--face-top', `${faceTop}px`);
        drive.classList.add('is-split');
    };

    /** Put the drive back together as a single un-clipped plate. */
    const healDriveFace = () => {
        drive.classList.remove('is-split');
        drive.style.removeProperty('--face-top');
        for (const layer of driveLayers) {
            layer.remove();
        }
        driveLayers = [];
    };

    /**
     * Animate the disk into the drive slot, then navigate to its article.
     */
    const insertDisk = (disk) => {
        if (inserting) {
            return;
        }
        inserting = true;

        const href = disk.href;
        lower(disk);
        disk.classList.remove('is-dragging');
        disk.classList.add('is-inserting');
        drive.classList.remove('is-target');
        drive.classList.add('is-loading');

        if (reducedMotion.matches) {
            setTimeout(() => { location.href = href; }, 180);
            return;
        }

        splitDriveFace();

        const rect = disk.getBoundingClientRect();
        const slot = slotOpening.getBoundingClientRect();

        // Final size: fits the slot opening, but a disk never grows to fill
        // a slot wider than itself.
        const layoutWidth = disk.offsetWidth;
        const scale = Math.min(1, (slot.width * 0.9) / layoutWidth);
        const finalHeight = disk.offsetHeight * scale;

        // Phase A: swing over the slot, rotate to exactly 180 so it's upside down,
        // shrink to slot size, bottom edge resting inside the opening.
        const dx = parseFloat(disk.style.getPropertyValue('--dx')) || 0;
        const dy = parseFloat(disk.style.getPropertyValue('--dy')) || 0;
        const targetCx = slot.left + slot.width / 2;
        const targetCy = slot.top + slot.height * 0.6 - finalHeight / 2;
        const ddx = targetCx - (rect.left + rect.width / 2);
        const ddy = targetCy - (rect.top + rect.height / 2);

        disk.style.transition =
            'translate 0.34s cubic-bezier(0.3, 0.7, 0.4, 1), ' +
            'rotate 0.34s ease-out, scale 0.34s ease-out';
        disk.style.setProperty('--dx', `${dx + ddx}px`);
        disk.style.setProperty('--dy', `${dy + ddy}px`);
        disk.style.setProperty('--rot', '180deg');
        disk.style.setProperty('--scale', String(scale));

        // Phase B: drop behind the drive's front face and slide down into
        // the slot. The face is opaque, so it hides whatever has gone in
        // without the descent needing to stay in step with anything.
        const descent = finalHeight + 30;
        let descending = false;
        const descend = () => {
            if (descending) {
                return;
            }
            descending = true;
            disk.removeEventListener('transitionend', onSwingEnd);
            disk.classList.add('is-entering');
            disk.style.transition = 'translate 0.5s cubic-bezier(0.6, 0, 0.8, 0.4)';
            disk.style.setProperty('--dy', `${dy + ddy + descent}px`);
        };

        // Only once the swing-over has landed, or the disk would jump behind
        // the plate while still crossing it. Phase A also transitions rotate
        // and scale, and the LOAD button fades out inside the disk, so the
        // arriving event has to be the disk's own translate. A disk dropped
        // exactly on its target does not transition it at all and so never
        // fires: the timeout is the one that runs then.
        const onSwingEnd = (e) => {
            if (e.target === disk && e.propertyName === 'translate') {
                descend();
            }
        };
        disk.addEventListener('transitionend', onSwingEnd);
        setTimeout(descend, 380);

        // Let the LED blink as the drive "reads", then go.
        setTimeout(() => { location.href = href; }, 1150);
    };

    /**
     * Is the pointer over the drive's plate (generous drop target)?
     * During a drag the plate's rect is cached (the drive is position:
     * fixed, so it cannot move mid-drag); measuring it per pointermove
     * forced a style/layout flush on every event.
     */
    let plateRect = null;
    const overDrive = (x, y) => {
        const plate = plateRect ?? drivePlate.getBoundingClientRect();
        return x >= plate.left - 12 && x <= plate.right + 12 &&
            y >= plate.top - 18 && y <= plate.bottom + 12;
    };

    // ------------------------------------------------------------------
    // Dragging with pointer events.
    // ------------------------------------------------------------------
    for (const disk of disks) {
        let pointerId = null;
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let baseDx = 0;
        let baseDy = 0;
        let lastX = 0;

        disk.addEventListener('dragstart', (e) => e.preventDefault());

        disk.addEventListener('pointerdown', (e) => {
            if (inserting || pointerId !== null || e.button !== 0) {
                return;
            }
            // Touch/pen drags only a picked-up disk, so page scroll still works.
            const canDrag = e.pointerType === 'mouse' || disk.classList.contains('is-raised');
            if (!canDrag) {
                return;
            }
            pointerId = e.pointerId;
            dragging = false;
            startX = lastX = e.clientX;
            startY = e.clientY;
            baseDx = parseFloat(disk.style.getPropertyValue('--dx')) || 0;
            baseDy = parseFloat(disk.style.getPropertyValue('--dy')) || 0;
        });

        let rafId = 0;
        let moveX = 0;
        let moveY = 0;

        // One style write per frame, however fast the pointer reports
        // (gaming mice poll at up to 1000Hz; pointermove is not vsynced).
        const applyMove = () => {
            rafId = 0;
            disk.style.setProperty('--dx', `${baseDx + moveX - startX}px`);
            disk.style.setProperty('--dy', `${baseDy + moveY - startY}px`);

            // Sway with horizontal velocity, like it is held by one corner.
            const vx = moveX - lastX;
            lastX = moveX;
            const sway = Math.max(-9, Math.min(9, vx * 0.9));
            disk.style.setProperty('--rot', `${sway}deg`);

            drive.classList.toggle('is-target', overDrive(moveX, moveY));
        };

        disk.addEventListener('pointermove', (e) => {
            if (e.pointerId !== pointerId || inserting) {
                return;
            }
            if (!dragging) {
                if (Math.hypot(e.clientX - startX, e.clientY - startY) < 7) {
                    return;
                }
                dragging = true;
                suppressClick = true;
                disk.classList.add('is-dragging');
                disk.setPointerCapture(pointerId);
                plateRect = drivePlate.getBoundingClientRect();
            }

            moveX = e.clientX;
            moveY = e.clientY;
            if (rafId === 0) {
                rafId = requestAnimationFrame(applyMove);
            }
        });

        const endDrag = (e, cancelled) => {
            if (e.pointerId !== pointerId) {
                return;
            }
            pointerId = null;
            if (!dragging) {
                return;
            }
            dragging = false;
            if (rafId !== 0) {
                cancelAnimationFrame(rafId);
                rafId = 0;
            }
            const droppedInDrive = !cancelled && !inserting && overDrive(e.clientX, e.clientY);
            plateRect = null;
            drive.classList.remove('is-target');
            disk.classList.remove('is-dragging');

            if (droppedInDrive) {
                insertDisk(disk);
                return;
            }

            // Drift back to its resting spot.
            disk.style.setProperty('--dx', '0px');
            disk.style.setProperty('--dy', '0px');
            disk.style.removeProperty('--rot');

            // The pick-up tap already happened; a drag should not re-trigger
            // click navigation. Cleared on the next tick.
            setTimeout(() => { suppressClick = false; }, 0);
        };

        disk.addEventListener('pointerup', (e) => endDrag(e, false));
        disk.addEventListener('pointercancel', (e) => endDrag(e, true));

        // ------------------------------------------------------------------
        // Click: pick up, load, or put down.
        // ------------------------------------------------------------------
        disk.addEventListener('click', (e) => {
            if (suppressClick || inserting || disk.classList.contains('is-inserting')) {
                e.preventDefault();
                return;
            }

            // Keyboard activation (Enter): feed the disk to the drive.
            if (e.detail === 0) {
                e.preventDefault();
                insertDisk(disk);
                return;
            }

            e.preventDefault();
            if (!disk.classList.contains('is-raised')) {
                raise(disk);
            } else if (e.target.closest('.load-btn')) {
                insertDisk(disk);
            } else {
                lower(disk);
            }
        });
    }

    // Put a raised disk down when clicking the empty desk, or pressing Escape.
    document.addEventListener('click', (e) => {
        if (raisedDisk && !e.target.closest('a.disk') && !suppressClick) {
            lower(raisedDisk);
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && raisedDisk) {
            lower(raisedDisk);
        }
    });

    // The eject button politely puts a held disk back.
    drive.querySelector('.drive-eject')?.addEventListener('click', () => {
        if (raisedDisk) {
            lower(raisedDisk);
        }
    });

    /**
     * Returning via the back/forward cache restores the page mid-insert:
     * disk in the drive, inserting flag blocking every click. Reset by
     * having the drive eject the disk back to its resting spot.
     */
    window.addEventListener('pageshow', (e) => {
        if (!e.persisted) {
            return;
        }
        inserting = false;
        suppressClick = false;
        drive.classList.remove('is-loading', 'is-target');
        if (raisedDisk) {
            lower(raisedDisk);
        }

        // The restored page brings back the split drive and its backdrop
        // along with everything else, so both paths below have to heal it.
        const inserted = document.querySelector('a.disk.is-inserting');
        if (!inserted) {
            healDriveFace();
            return;
        }

        const reset = () => {
            healDriveFace();
            inserted.classList.remove('is-inserting', 'is-entering');
            inserted.style.removeProperty('--dx');
            inserted.style.removeProperty('--dy');
            inserted.style.removeProperty('--rot');
            inserted.style.removeProperty('--scale');
        };

        if (reducedMotion.matches) {
            inserted.style.transition = '';
            reset();
            return;
        }

        // Rise back out of the slot, emerging at the opening, then drift to
        // the resting spot (the class transition takes over once the
        // overrides clear). The disk sits in the slot however far the insert
        // had got, so it belongs between the drive's halves for the rise.
        // Re-split rather than trusting the restored one: the window may
        // have been resized while the article was open.
        splitDriveFace();
        const scale = parseFloat(inserted.style.getPropertyValue('--scale')) || 1;
        const dy = parseFloat(inserted.style.getPropertyValue('--dy')) || 0;
        const height = inserted.offsetHeight * scale;
        inserted.classList.add('is-entering');
        inserted.style.transition = 'translate 0.35s cubic-bezier(0.2, 0.6, 0.3, 1)';
        inserted.style.setProperty('--dy', `${dy - height - 30}px`);
        setTimeout(() => {
            inserted.style.transition = '';
            reset();
        }, 400);
    });
})();
