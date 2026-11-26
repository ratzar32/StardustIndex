// modals.js
// Menu / About / Privacy Policy / Imprint open a simple popup instead of
// navigating anywhere. Each modal's placeholder text lives directly in
// index.html (search for .modal-body) - edit it there whenever you have
// the real copy ready.

document.addEventListener('DOMContentLoaded', () => {
    const triggers = document.querySelectorAll('[data-modal-trigger]');
    const overlays = document.querySelectorAll('.modal-overlay');

    function openModal(name) {
        const overlay = document.querySelector(`.modal-overlay[data-modal="${name}"]`);
        if (overlay) overlay.hidden = false;
    }

    function closeModal(overlay) {
        overlay.hidden = true;
    }

    triggers.forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(trigger.getAttribute('data-modal-trigger'));
        });
    });

    overlays.forEach((overlay) => {
        // click on the dark backdrop (not the box itself) closes it
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay);
        });
        const closeBtn = overlay.querySelector('[data-modal-close]');
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal(overlay));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            overlays.forEach((overlay) => {
                if (!overlay.hidden) closeModal(overlay);
            });
        }
    });
});
