// starfield.js
// This is your original canvas algorithm (ported from CoffeeScript to plain
// JS - browsers can't run CoffeeScript directly, and the jQuery
// "smartresize" plugin it used isn't loaded on this page), kept intact:
// random dots, an occasional small clearRect on each one, and one larger
// vertical clearRect band per frame - that combination is what produces the
// flickering vertical-bar "city" look, not just plain dots.
//
// The only change from a literal port is throttling: the previous full-speed
// version ran this whole loop 60 times a second forever, which was the
// actual source of the "heavy" complaint. It's now capped to ~24 redraws a
// second instead, which is imperceptibly different to the eye but roughly
// 2.5x less work for the browser.

(function () {
    const TARGET_FPS = 24;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    function initStarCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        let lastFrameTime = 0;

        function drawRect(color, origin, w, h) {
            const clr = color || '#000';
            const o = origin || { x: 0, y: 0 };
            const width = w || 5;
            const height = h || width;
            ctx.fillStyle = clr;
            ctx.fillRect(o.x, o.y, width, height);
            if (Math.random() < 0.05) {
                ctx.clearRect(o.x, o.y, width * 2, height * 2);
            }
        }

        function draw(timestamp) {
            window.requestAnimationFrame(draw);
            if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
            lastFrameTime = timestamp;

            let lastX = 0;
            let lastY = 0;
            // capped so very wide screens don't get an excessive dot count
            const count = Math.min(canvas.width * 3, 4500);

            for (let i = 0; i <= count; i++) {
                const x = Math.round(Math.random() * canvas.width);
                const y = Math.round(Math.random() * canvas.height);
                drawRect('#ccc', { x: x, y: y }, Math.random() * 1.5);
                lastX = x;
                lastY = y;
            }

            ctx.clearRect(lastX, lastY, Math.round(Math.random() * 150), canvas.height);
        }

        function resize() {
            const rect = canvas.parentElement.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                canvas.width = Math.round(rect.width);
                canvas.height = Math.round(rect.height);
            }
        }

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => resize());
            ro.observe(canvas.parentElement);
        }
        resize();
        window.addEventListener('load', resize);
        window.setTimeout(resize, 300);
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 150);
        });

        window.requestAnimationFrame(draw);
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('canvas.cnv-star').forEach(initStarCanvas);
    });
})();
