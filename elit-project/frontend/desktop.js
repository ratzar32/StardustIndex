// desktop.js - Windows 10 desktop behaviour (ported from your template) +
// the Chapters File Explorer window. The clock is static (set in chapters.html).

$(document).ready(function () {

    // ---------- Start menu / taskbar (from the template) ----------
    $('.icon.win').on('click', function () {
        var target = $(this).attr('data-target');
        $(target).toggleClass('open');
        $('.all-icons').removeClass('open');
    });

    $('.icon.top.bars').on('click', function () {
        $('.startmenu .icons').toggleClass('open');
    });

    $('.desktop, .app, .program, .icon.application, .cortana').on('click', function () {
        $('.startmenu, .icons, .icon.win, .all-icons').removeClass('open');
    });

    $('.tray .peek').on('mouseenter', function () { $('body').addClass('peek'); });
    $('.tray .peek').on('mouseleave', function () { $('body').removeClass('peek'); });

    $('.tray .more-icons').on('click', function () { $('.all-icons').toggleClass('open'); });

    // ---------- Edge app (opens chapter 1's site) ----------
    var $addressbar = $('.edge-url');
    var $browser = $('.edge-browser');

    function normalise(addr) {
        addr = $.trim(addr);
        return /^https?:\/\//i.test(addr) ? addr : 'https://' + addr;
    }
    function ensureEdgeLoaded() {
        if (!$browser.attr('src')) $browser.attr('src', normalise($addressbar.val()));
    }

    $('.taskbar .icon.application').on('click', function () {
        var target = $(this).attr('data-target');
        if (target === '.id-edge') ensureEdgeLoaded();
        $(target).toggleClass('open minimized');
        $(this).toggleClass('open');
    });

    $('.id-edge .toolbar .fa-times').on('click', function () {
        $('.id-edge').removeClass('open').addClass('minimized');
        $('.icon.edge').removeClass('open');
    });

    // hover preview of the Edge window above its taskbar icon
    $('.icon.edge').on('mouseenter', function () {
        ensureEdgeLoaded();
        $('.app-preview.preview-edge .content').html($('.id-edge iframe').clone());
    });

    $addressbar.on('keypress', function (e) {
        if (e.which === 13) $browser.attr('src', normalise($addressbar.val()));
    });
    $('.id-edge .fa-refresh').on('click', function () {
        $browser.attr('src', normalise($addressbar.val()));
    });

    if (window.matchMedia('(min-width: 701px)').matches) {
        $('.app').draggable({ handle: '.draggable' });
        $('.app').resizable({ minWidth: 320, minHeight: 240 });
    }

    // ---------- Chapters window (File Explorer) ----------
    var win = document.getElementById('explorer');
    var viewList = document.getElementById('viewList');
    var backBtn = document.getElementById('backBtn');
    var title = document.getElementById('winTitle');
    var pathText = document.getElementById('pathText');
    var status = document.getElementById('statusText');
    var $fileApp = $('.icon.file-app');

    function openWin() {
        win.hidden = false;
        $fileApp.addClass('running');
        $('.startmenu, .icons, .icon.win').removeClass('open');
    }
    function hideWin() { win.hidden = true; $fileApp.removeClass('running'); }
    function closeWin() { hideWin(); showList(); }

    function showList() {
        $('.chapter-view').each(function () { this.hidden = true; });
        viewList.hidden = false;
        backBtn.disabled = true;
        title.textContent = 'Chapters';
        pathText.innerHTML = 'This PC &rsaquo; Chapters';
        status.textContent = '9 items';
    }
    function showChapter(id, label) {
        var view = document.getElementById(id);
        if (!view) return;
        viewList.hidden = true;
        view.hidden = false;
        backBtn.disabled = false;
        title.textContent = label;
        pathText.innerHTML = 'This PC &rsaquo; Chapters &rsaquo; ' + label;
        status.textContent = '';
    }

    // every [data-open="explorer"] (desktop icon, taskbar, start menu, tile)
    $('[data-open="explorer"]').each(function () {
        var el = this, $el = $(this);
        var coarse = window.matchMedia('(pointer: coarse)').matches;
        if ($el.hasClass('desk-icon') && !coarse) {
            // desktop icon: click selects, double-click / Enter opens (like Windows)
            $el.on('click', function () { $el.addClass('selected'); });
            $el.on('dblclick', openWin);
            $el.on('keydown', function (e) { if (e.key === 'Enter') openWin(); });
            $(document).on('click', function (e) { if (!el.contains(e.target)) $el.removeClass('selected'); });
        } else if ($el.hasClass('file-app')) {
            $el.on('click', function () { win.hidden ? openWin() : hideWin(); });
        } else {
            $el.on('click', openWin);
        }
    });

    $(win).find('[data-win-close]').on('click', closeWin);
    $(win).find('[data-win-min]').on('click', hideWin);
    $(win).find('[data-win-max]').on('click', function () { $(win).toggleClass('maxed'); });
    $(backBtn).on('click', showList);
    $(document).on('keydown', function (e) { if (e.key === 'Escape' && !win.hidden) closeWin(); });

    $(viewList).find('.file-item').on('click', function () {
        var item = this;
        if ($(item).hasClass('locked')) {
            $(item).removeClass('shake'); void item.offsetWidth; $(item).addClass('shake');
            status.textContent = $.trim($(item).text()) + ' is coming soon';
            return;
        }
        showChapter($(item).attr('data-chapter'), $.trim($(item).text()));
    });

    // drag the window by its title bar
    var bar = win.querySelector('[data-drag]');
    var sx, sy, ox, oy, dragging = false;
    bar.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.tb-controls') || $(win).hasClass('maxed')) return;
        var r = win.getBoundingClientRect();
        $(win).addClass('dragged');
        win.style.left = r.left + 'px'; win.style.top = r.top + 'px';
        sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; dragging = true;
        bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var x = Math.max(-win.offsetWidth + 80, Math.min(window.innerWidth - 80, ox + e.clientX - sx));
        var y = Math.max(0, Math.min(window.innerHeight - 90, oy + e.clientY - sy));
        win.style.left = x + 'px'; win.style.top = y + 'px';
    });
    bar.addEventListener('pointerup', function () { dragging = false; });
    bar.addEventListener('dblclick', function (e) { if (!e.target.closest('.tb-controls')) $(win).toggleClass('maxed'); });
});
