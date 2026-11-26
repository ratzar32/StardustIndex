// finder.js
// Clicking a desktop folder icon opens its matching Finder-style window
// (data-window on the icon matches data-window on the window). The red
// traffic-light dot closes it, same as a real Mac window.

document.addEventListener('DOMContentLoaded', () => {
    const icons = document.querySelectorAll('.folder-icon');
    const windows = document.querySelectorAll('.finder-window');

    function closeAll() {
        windows.forEach((w) => { w.hidden = true; });
    }

    icons.forEach((icon) => {
        icon.addEventListener('click', () => {
            const name = icon.getAttribute('data-window');
            closeAll();
            const win = document.querySelector(`.finder-window[data-window="${name}"]`);
            if (win) win.hidden = false;
        });
    });

    windows.forEach((win) => {
        const closeBtn = win.querySelector('[data-finder-close]');
        if (closeBtn) closeBtn.addEventListener('click', () => { win.hidden = true; });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();
    });
});
