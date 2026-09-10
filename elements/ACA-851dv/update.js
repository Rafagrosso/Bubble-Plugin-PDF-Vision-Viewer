function(instance, properties, context) {
    var doc_url = properties.document_url;
    var idname = 'doc_' + properties.doc_viewer_id;

    function publish(valid, pages, title, author, err) {
        instance.publishState && instance.publishState('is_valid_document', !!valid);
        instance.publishState && instance.publishState('total_pages', pages || 0);
        if (title !== undefined) instance.publishState && instance.publishState('document_title', title || '');
        if (author !== undefined) instance.publishState && instance.publishState('document_author', author || '');
        instance.publishState && instance.publishState('error_message', err || '');
    }

    if (!doc_url || String(doc_url).trim() === '') {
        try { instance.canvas.empty(); instance.data.created = false; } catch (e) {}
        publish(false, 0, '', '', '');
        return;
    }

    var domain_url = 'https://s3.amazonaws.com/appforest_uf';
    if (/.cdn.bubble.io/.test(doc_url)) {
        domain_url = 'https://' + properties.app_name + '.cdn.bubble.io';
        var m = doc_url.match(new RegExp('//' + '(.*)' + '.cdn.bubble.io'));
        doc_url = doc_url.replace(m[1], properties.app_name);
    }
    if (doc_url.indexOf('//') === 0) doc_url = 'https:' + doc_url;

    var clean_url = doc_url.split('?')[0].split('#')[0];
    var ext = (clean_url.match(/\.([a-zA-Z0-9]+)$/) || [null, ''])[1].toLowerCase();
    var is_docx = ext === 'docx';
    var is_doc_legacy = ext === 'doc';

    var theme_light = properties.theme === 'light';
    var bg = properties.background_color || (theme_light ? '#ffffff' : 'rgba(42,42,46,1)');
    var text = properties.text_color || (theme_light ? '#111111' : 'rgba(245,245,245,1)');
    var accent = properties.accent_color || 'rgba(59,130,246,1)';

    // Build the shell once; later calls only touch existing elements.
    if (!instance.data.created) {
        instance.canvas.empty();

        var $root = $('<div class="docviewer-root" id="' + idname + '"></div>').css({
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden', fontFamily: 'sans-serif'
        });
        var $toolbar = $('<div class="docviewer-toolbar"></div>').css({
            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
            borderBottom: '1px solid rgba(128,128,128,.25)', flexWrap: 'wrap'
        });
        var $btnToggle = $('<button class="docviewer-btn" title="Sidebar">&#9776;</button>');
        var $search = $('<input type="text" class="docviewer-search" placeholder="Search...">');
        var $searchCount = $('<span class="docviewer-search-count" style="font-size:12px;opacity:.75"></span>');
        var $spacer = $('<div style="flex:1"></div>');
        var $btnFull = $('<button class="docviewer-btn" title="Presentation mode">&#9974;</button>');
        var $btnPrint = $('<button class="docviewer-btn" title="Print">&#128424;</button>');
        var $btnDownload = $('<button class="docviewer-btn" title="Download">&#11015;</button>');
        $toolbar.append($btnToggle, $search, $searchCount, $spacer, $btnFull, $btnPrint, $btnDownload);
        $toolbar.find('.docviewer-btn').css({ background: 'transparent', border: '1px solid currentColor', borderRadius: '4px', cursor: 'pointer', padding: '4px 10px' });
        $search.css({ background: 'transparent', border: '1px solid currentColor', borderRadius: '4px', padding: '4px 8px' });

        var $bodyRow = $('<div class="docviewer-body"></div>').css({ flex: '1', display: 'flex', minHeight: 0, position: 'relative' });
        var $sidebar = $('<div class="docviewer-sidebar"></div>').css({ width: '180px', overflowY: 'auto', borderRight: '1px solid rgba(128,128,128,.25)', padding: '8px', fontSize: '13px' });
        var $content = $('<div class="docviewer-content"></div>').css({ flex: '1', overflow: 'auto', position: 'relative', padding: '16px' });
        var $watermark = $('<div class="docviewer-watermark"></div>').css({ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 });

        $bodyRow.append($sidebar, $content, $watermark);
        $root.append($toolbar, $bodyRow);
        instance.canvas.append($root);

        instance.data.created = true;
        instance.data.els = {
            root: $root, toolbar: $toolbar, sidebar: $sidebar, content: $content, watermark: $watermark,
            search: $search, searchCount: $searchCount, btnToggle: $btnToggle, btnFull: $btnFull, btnPrint: $btnPrint, btnDownload: $btnDownload
        };
        instance.data.currentPage = 1;

        $btnToggle.on('click', function () { $sidebar.toggle(); });
        $btnFull.on('click', function () {
            var el = $root.get(0);
            if (document.fullscreenElement) { document.exitFullscreen(); }
            else if (el.requestFullscreen) { el.requestFullscreen(); }
        });
        $btnPrint.on('click', function () {
            instance.triggerEvent && instance.triggerEvent('print_started');
            var w = window.open('', '_blank');
            w.document.write('<html><head><title>Print</title></head><body>' + $content.html() + '</body></html>');
            w.document.close();
            w.focus();
            setTimeout(function () { w.print(); w.close(); }, 300);
        });
        $btnDownload.on('click', function () {
            instance.triggerEvent && instance.triggerEvent('download_started');
            var a = document.createElement('a');
            a.href = instance.data.doc_url;
            a.download = properties.rename_download_file || '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
        $search.on('input', function () { instance.data.runSearch && instance.data.runSearch($(this).val()); });

        $content.on('scroll.docviewer', function () {
            clearTimeout(instance.data.scrollT);
            instance.data.scrollT = setTimeout(function () {
                var sections = $content.find('.docviewer-page-wrapper > section');
                if (!sections.length) return;
                var top = $content.offset().top;
                var current = 1;
                sections.each(function (i) { if ($(this).offset().top - top <= 40) current = i + 1; });
                if (current !== instance.data.currentPage) {
                    instance.data.currentPage = current;
                    instance.publishState && instance.publishState('current_page', current);
                    instance.triggerEvent && instance.triggerEvent('page_changed');
                }
            }, 120);
        });
    }

    var els = instance.data.els;
    instance.data.doc_url = doc_url;

    function applyZoom() {
        var z = properties.page_to_fit ? 'page-fit' : (properties.initial_zoom || 'auto');
        var pct = 100;
        var n = parseInt(z, 10);
        if (!isNaN(n)) pct = n;
        els.content.css('zoom', (z === 'auto' || z === 'page-width' || z === 'page-fit') ? '' : (pct / 100));
        instance.publishState && instance.publishState('zoom_level', pct);
    }

    function renderOutline() {
        els.sidebar.empty();
        var heads = els.content.find('h1, h2, h3');
        if (!heads.length) { els.sidebar.append($('<div></div>').css('opacity', .6).text('No headings found')); return; }
        heads.each(function (i) {
            var $h = $(this);
            var label = $h.text().trim().slice(0, 60) || ('Heading ' + (i + 1));
            var $link = $('<div></div>').text(label).css({ cursor: 'pointer', padding: '4px 0', borderBottom: '1px solid rgba(128,128,128,.15)' });
            $link.on('click', function () { $h.get(0).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
            els.sidebar.append($link);
        });
    }

    function clearHighlights() {
        els.content.find('mark.docviewer-hit').each(function () {
            var $m = $(this);
            $m.replaceWith(document.createTextNode($m.text()));
        });
    }

    function runSearch(term) {
        clearHighlights();
        if (!term) { instance.publishState && instance.publishState('search_results_count', 0); return; }
        var re = new RegExp(String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        var count = 0;
        els.content.find('span, p, td, li, h1, h2, h3').each(function () {
            if (this.children.length) return;
            var t = this.textContent;
            if (!t || !re.test(t)) return;
            re.lastIndex = 0;
            var html = t.replace(re, function (mm) { count++; return '<mark class="docviewer-hit" style="background:' + accent + ';color:#fff">' + mm + '</mark>'; });
            $(this).html(html);
        });
        instance.publishState && instance.publishState('search_results_count', count);
        instance.triggerEvent && instance.triggerEvent('search_completed');
    }
    instance.data.runSearch = runSearch;

    function applyProtection() {
        var protect = !!properties.protected_mode;
        els.content.off('contextmenu.docprotect selectstart.docprotect');
        $(document).off('keydown.docprotect-' + idname);
        els.content.css('userSelect', protect ? 'none' : '');
        if (protect) {
            els.content.on('contextmenu.docprotect selectstart.docprotect', function (e) { e.preventDefault(); return false; });
            $(document).on('keydown.docprotect-' + idname, function (e) {
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
        var sections = els.content.find('.docviewer-page-wrapper > section');
        if (!sections.length) return;
        var idx = Math.max(1, Math.min(n, sections.length)) - 1;
        sections.get(idx).scrollIntoView({ behavior: 'smooth', block: 'start' });
        instance.data.currentPage = idx + 1;
        instance.publishState && instance.publishState('current_page', idx + 1);
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
    if (instance.data.docx_ready) runSearch(properties.search_word);

    // Fetch & render only when the URL actually changes.
    if (instance.data.loaded_url === doc_url) return;
    instance.data.loaded_url = doc_url;
    instance.data.docx_ready = false;

    instance.publishState && instance.publishState('is_loading', true);
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onload = function () {
        if (xhr.status && xhr.status >= 400) {
            instance.publishState && instance.publishState('is_loading', false);
            publish(false, 0, '', '', 'HTTP ' + xhr.status);
            instance.triggerEvent && instance.triggerEvent('document_error');
            return;
        }
        var buf = xhr.response;

        try {
            var zip = new JSZip();
            zip.loadAsync(buf).then(function (z) {
                var core = z.file('docProps/core.xml');
                return core ? core.async('text') : '';
            }).then(function (xml) {
                var title = '', author = '';
                if (xml) {
                    var t = xml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/);
                    var a = xml.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/);
                    title = t ? t[1] : '';
                    author = a ? a[1] : '';
                }
                instance.publishState && instance.publishState('document_title', title);
                instance.publishState && instance.publishState('document_author', author);
            }).catch(function () {});
        } catch (e) {}

        if (is_docx) {
            els.content.empty();
            docx.renderAsync(buf, els.content.get(0), els.content.get(0), {
                className: 'docviewer-page',
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                breakPages: true,
                experimental: true,
                trimXmlDeclaration: true,
                useBase64URL: true
            }).then(function () {
                var pages = els.content.find('.docviewer-page-wrapper > section').length || 1;
                instance.data.docx_ready = true;
                instance.publishState && instance.publishState('is_loading', false);
                publish(true, pages);
                instance.triggerEvent && instance.triggerEvent('document_loaded');
                applyZoom();
                renderOutline();
                instance.data.goToPage(properties.start_page > 0 ? properties.start_page : 1);
                if (properties.search_word) runSearch(properties.search_word);
            }).catch(function (err) {
                instance.publishState && instance.publishState('is_loading', false);
                publish(false, 0, '', '', String((err && err.message) || err));
                instance.triggerEvent && instance.triggerEvent('document_error');
            });
        } else if (is_doc_legacy) {
            els.content.empty();
            var $frame = $('<iframe class="docviewer-legacy-frame" frameborder="0" allowfullscreen></iframe>').css({ width: '100%', height: '100%', border: 'none', background: '#fff' });
            $frame.attr('src', 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(doc_url));
            els.content.append($frame);
            instance.publishState && instance.publishState('is_loading', false);
            publish(true, 0);
            instance.triggerEvent && instance.triggerEvent('document_loaded');
        } else {
            instance.publishState && instance.publishState('is_loading', false);
            publish(false, 0, '', '', 'Unsupported file type: .' + ext + ' (use .doc or .docx)');
            instance.triggerEvent && instance.triggerEvent('document_error');
        }
    };
    xhr.onerror = function () {
        instance.publishState && instance.publishState('is_loading', false);
        publish(false, 0, '', '', 'Network error while loading document');
        instance.triggerEvent && instance.triggerEvent('document_error');
    };
    try { xhr.open('GET', doc_url); xhr.send(); }
    catch (ex) {
        instance.publishState && instance.publishState('is_loading', false);
        publish(false, 0, '', '', String(ex));
    }
}
