function(instance, properties, context) {
    var url = properties.spreadsheet_url;
    var idname = 'xls_' + properties.excel_viewer_id;

    function publish(valid, pages, title, author, err) {
        instance.publishState && instance.publishState('is_valid_spreadsheet', !!valid);
        instance.publishState && instance.publishState('total_pages', pages || 0);
        if (title !== undefined) instance.publishState && instance.publishState('spreadsheet_title', title || '');
        if (author !== undefined) instance.publishState && instance.publishState('spreadsheet_author', author || '');
        instance.publishState && instance.publishState('error_message', err || '');
    }

    if (!url || String(url).trim() === '') {
        try { instance.canvas.empty(); instance.data.created = false; } catch (e) {}
        publish(false, 0, '', '', '');
        return;
    }

    var domain_url = 'https://s3.amazonaws.com/appforest_uf';
    if (/.cdn.bubble.io/.test(url)) {
        domain_url = 'https://' + properties.app_name + '.cdn.bubble.io';
        var m = url.match(new RegExp('//' + '(.*)' + '.cdn.bubble.io'));
        url = url.replace(m[1], properties.app_name);
    }
    if (url.indexOf('//') === 0) url = 'https:' + url;

    var clean_url = url.split('?')[0].split('#')[0];
    var ext = (clean_url.match(/\.([a-zA-Z0-9]+)$/) || [null, ''])[1].toLowerCase();
    var supported = ['xlsx', 'xls', 'csv'].indexOf(ext) !== -1;

    var theme_light = properties.theme === 'light';
    var bg = properties.background_color || (theme_light ? '#ffffff' : 'rgba(42,42,46,1)');
    var text = properties.text_color || (theme_light ? '#111111' : 'rgba(245,245,245,1)');
    var accent = properties.accent_color || 'rgba(59,130,246,1)';

    // Build the shell once; later calls only touch existing elements.
    if (!instance.data.created) {
        instance.canvas.empty();

        var $root = $('<div class="xlsviewer-root" id="' + idname + '"></div>').css({
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden', fontFamily: 'sans-serif'
        });
        var $toolbar = $('<div class="xlsviewer-toolbar"></div>').css({
            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
            borderBottom: '1px solid rgba(128,128,128,.25)', flexWrap: 'wrap'
        });
        var $btnToggle = $('<button class="xlsviewer-btn" title="Sidebar">&#9776;</button>');
        var $search = $('<input type="text" class="xlsviewer-search" placeholder="Search...">');
        var $searchCount = $('<span class="xlsviewer-search-count" style="font-size:12px;opacity:.75"></span>');
        var $spacer = $('<div style="flex:1"></div>');
        var $btnFull = $('<button class="xlsviewer-btn" title="Presentation mode">&#9974;</button>');
        var $btnPrint = $('<button class="xlsviewer-btn" title="Print">&#128424;</button>');
        var $btnDownload = $('<button class="xlsviewer-btn" title="Download">&#11015;</button>');
        $toolbar.append($btnToggle, $search, $searchCount, $spacer, $btnFull, $btnPrint, $btnDownload);
        $toolbar.find('.xlsviewer-btn').css({ background: 'transparent', border: '1px solid currentColor', borderRadius: '4px', cursor: 'pointer', padding: '4px 10px' });
        $search.css({ background: 'transparent', border: '1px solid currentColor', borderRadius: '4px', padding: '4px 8px' });

        var $bodyRow = $('<div class="xlsviewer-body"></div>').css({ flex: '1', display: 'flex', minHeight: 0, position: 'relative' });
        var $sidebar = $('<div class="xlsviewer-sidebar"></div>').css({ width: '180px', overflowY: 'auto', borderRight: '1px solid rgba(128,128,128,.25)', padding: '8px', fontSize: '13px' });
        var $content = $('<div class="xlsviewer-content"></div>').css({ flex: '1', overflow: 'auto', position: 'relative', padding: '16px' });
        var $watermark = $('<div class="xlsviewer-watermark"></div>').css({ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 });

        $bodyRow.append($sidebar, $content, $watermark);
        $root.append($toolbar, $bodyRow);
        instance.canvas.append($root);

        instance.data.created = true;
        instance.data.els = {
            root: $root, toolbar: $toolbar, sidebar: $sidebar, content: $content, watermark: $watermark,
            search: $search, searchCount: $searchCount, btnToggle: $btnToggle, btnFull: $btnFull, btnPrint: $btnPrint, btnDownload: $btnDownload
        };
        instance.data.currentPage = 1;
        instance.data.sheetNames = [];

        $btnToggle.on('click', function () { $sidebar.toggle(); });
        $btnFull.on('click', function () {
            var el = $root.get(0);
            if (document.fullscreenElement) { document.exitFullscreen(); }
            else if (el.requestFullscreen) { el.requestFullscreen(); }
        });
        $btnPrint.on('click', function () {
            instance.triggerEvent && instance.triggerEvent('print_started');
            var w = window.open('', '_blank');
            var $visible = $content.find('.xlsviewer-sheet:visible').first();
            w.document.write('<html><head><title>Print</title></head><body>' + ($visible.length ? $visible.html() : $content.html()) + '</body></html>');
            w.document.close();
            w.focus();
            setTimeout(function () { w.print(); w.close(); }, 300);
        });
        $btnDownload.on('click', function () {
            instance.triggerEvent && instance.triggerEvent('download_started');
            var a = document.createElement('a');
            a.href = instance.data.file_url;
            a.download = properties.rename_download_file || '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
        $search.on('input', function () { instance.data.runSearch && instance.data.runSearch($(this).val()); });
    }

    var els = instance.data.els;
    instance.data.file_url = url;

    function applyZoom() {
        var z = properties.page_to_fit ? 'page-fit' : (properties.initial_zoom || 'auto');
        var pct = 100;
        var n = parseInt(z, 10);
        if (!isNaN(n)) pct = n;
        els.content.css('zoom', (z === 'auto' || z === 'page-width' || z === 'page-fit') ? '' : (pct / 100));
        els.content.find('table').css('width', properties.page_to_fit ? '100%' : '');
        instance.publishState && instance.publishState('zoom_level', pct);
    }

    function renderSheetList() {
        els.sidebar.empty();
        var names = instance.data.sheetNames || [];
        if (!names.length) { els.sidebar.append($('<div></div>').css('opacity', .6).text('No sheets')); return; }
        names.forEach(function (name, i) {
            var $item = $('<div></div>').text(name).css({
                cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', marginBottom: '2px',
                background: (i + 1 === instance.data.currentPage) ? accent : 'transparent',
                color: (i + 1 === instance.data.currentPage) ? '#fff' : 'inherit'
            });
            $item.on('click', function () { instance.data.goToPage(i + 1); });
            els.sidebar.append($item);
        });
    }

    function showSheet(n) {
        var $sheets = els.content.find('.xlsviewer-sheet');
        $sheets.hide();
        $sheets.eq(n - 1).show();
    }

    function clearHighlights() {
        els.content.find('mark.xlsviewer-hit').each(function () {
            var $m = $(this);
            $m.replaceWith(document.createTextNode($m.text()));
        });
    }

    function runSearch(term) {
        clearHighlights();
        if (!term) { instance.publishState && instance.publishState('search_results_count', 0); return; }
        var re = new RegExp(String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        var count = 0;
        els.content.find('.xlsviewer-sheet:visible td, .xlsviewer-sheet:visible th').each(function () {
            var t = this.textContent;
            if (!t || !re.test(t)) return;
            re.lastIndex = 0;
            var html = t.replace(re, function (mm) { count++; return '<mark class="xlsviewer-hit" style="background:' + accent + ';color:#fff">' + mm + '</mark>'; });
            $(this).html(html);
        });
        instance.publishState && instance.publishState('search_results_count', count);
        instance.triggerEvent && instance.triggerEvent('search_completed');
    }
    instance.data.runSearch = runSearch;

    function applyProtection() {
        var protect = !!properties.protected_mode;
        els.content.off('contextmenu.xlsprotect selectstart.xlsprotect');
        $(document).off('keydown.xlsprotect-' + idname);
        els.content.css('userSelect', protect ? 'none' : '');
        if (protect) {
            els.content.on('contextmenu.xlsprotect selectstart.xlsprotect', function (e) { e.preventDefault(); return false; });
            $(document).on('keydown.xlsprotect-' + idname, function (e) {
                var k = e.key ? e.key.toLowerCase() : '';
                if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'p' || k === 'c')) { e.preventDefault(); return false; }
            });
        }
    }

    function renderWatermark() {
        els.watermark.empty();
        if (!properties.watermark_text) return;
        var opacity = (properties.watermark_opacity === undefined || properties.watermark_opacity === null || properties.watermark_opacity === '') ? 0.14 : properties.watermark_opacity;
        var $tile = $('<div></div>').css({
            position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '40px', transform: 'rotate(-30deg) scale(1.4)', opacity: opacity, color: text
        });
        for (var i = 0; i < 24; i++) {
            $tile.append($('<div></div>').text(properties.watermark_text).css({ whiteSpace: 'nowrap', fontSize: '16px', fontWeight: 'bold' }));
        }
        els.watermark.append($tile);
    }

    instance.data.goToPage = function (n) {
        var names = instance.data.sheetNames || [];
        if (!names.length) return;
        var idx = Math.max(1, Math.min(n, names.length));
        instance.data.currentPage = idx;
        showSheet(idx);
        renderSheetList();
        clearHighlights();
        if (properties.search_word) runSearch(properties.search_word);
        els.content.scrollTop(0);
        instance.publishState && instance.publishState('current_page', idx);
        instance.triggerEvent && instance.triggerEvent('page_changed');
    };

    // Reactive UI toggles (run on every property update).
    els.root.css({ background: bg, color: text });
    els.toolbar.toggle(!properties.remove_top_toolbar);
    els.btnToggle.toggle(!properties.remove_left_toggle);
    els.search.toggle(!properties.remove_search);
    els.searchCount.toggle(!properties.remove_search);
    els.btnFull.toggle(!properties.remove_presentation_mode);
    els.btnPrint.toggle(!(properties.remove_print || properties.protected_mode));
    els.btnDownload.toggle(!(properties.remove_download || properties.protected_mode));
    els.sidebar.toggle(!properties.remove_bookmark && !!properties.show_thumbnails);
    applyProtection();
    renderWatermark();
    applyZoom();
    if (instance.data.sheetNames && instance.data.sheetNames.length) runSearch(properties.search_word || '');

    // Fetch & render only when the URL actually changes.
    if (instance.data.loaded_url === url) return;
    instance.data.loaded_url = url;
    instance.data.sheetNames = [];

    instance.publishState && instance.publishState('is_loading', true);
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onload = function () {
        if (xhr.status && xhr.status >= 400) {
            instance.publishState && instance.publishState('is_loading', false);
            publish(false, 0, '', '', 'HTTP ' + xhr.status);
            instance.triggerEvent && instance.triggerEvent('spreadsheet_error');
            return;
        }
        if (!supported) {
            instance.publishState && instance.publishState('is_loading', false);
            publish(false, 0, '', '', 'Unsupported file type: .' + ext + ' (use .xlsx, .xls or .csv)');
            instance.triggerEvent && instance.triggerEvent('spreadsheet_error');
            return;
        }
        try {
            var data = new Uint8Array(xhr.response);
            var wb = XLSX.read(data, { type: 'array', cellStyles: true });
            var names = wb.SheetNames || [];
            instance.data.sheetNames = names;

            els.content.empty();
            names.forEach(function (name, i) {
                var html = XLSX.utils.sheet_to_html(wb.Sheets[name], { id: idname + '-sheet-' + i, editable: false });
                var $wrap = $('<div class="xlsviewer-sheet"></div>').css({ display: i === 0 ? 'block' : 'none' });
                $wrap.append($(html));
                $wrap.find('table').css({ borderCollapse: 'collapse', width: properties.page_to_fit ? '100%' : 'auto' });
                $wrap.find('td, th').css({ border: '1px solid rgba(128,128,128,.35)', padding: '4px 8px' });
                els.content.append($wrap);
            });

            var title = (wb.Props && wb.Props.Title) || '';
            var author = (wb.Props && wb.Props.Author) || '';

            instance.publishState && instance.publishState('is_loading', false);
            publish(true, names.length, title, author);
            instance.triggerEvent && instance.triggerEvent('spreadsheet_loaded');
            renderSheetList();
            applyZoom();
            instance.data.goToPage(properties.start_page > 0 ? properties.start_page : 1);
        } catch (err) {
            instance.publishState && instance.publishState('is_loading', false);
            publish(false, 0, '', '', String((err && err.message) || err));
            instance.triggerEvent && instance.triggerEvent('spreadsheet_error');
        }
    };
    xhr.onerror = function () {
        instance.publishState && instance.publishState('is_loading', false);
        publish(false, 0, '', '', 'Network error while loading spreadsheet');
        instance.triggerEvent && instance.triggerEvent('spreadsheet_error');
    };
    try { xhr.open('GET', url); xhr.send(); }
    catch (ex) {
        instance.publishState && instance.publishState('is_loading', false);
        publish(false, 0, '', '', String(ex));
    }
}
