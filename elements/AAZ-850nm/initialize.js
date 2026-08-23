function(instance, context) {

    // ------------------------------------------------------------------
    // PDF Vision Viewer - self-contained PDF.js based viewer
    // All viewer logic lives here; update.js only applies properties and
    // element actions call the methods exposed on instance.data.pv
    // ------------------------------------------------------------------

    var root = (instance.canvas && instance.canvas.get) ? instance.canvas.get(0)
             : (instance.canvas && instance.canvas[0]) ? instance.canvas[0]
             : instance.canvas;

    if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';
    }

    // ---------------------------------------------------------------
    // Shared stylesheet (injected once per page)
    // ---------------------------------------------------------------
    if (!document.getElementById('pv-styles')) {
        var css = ''
        + '.pv-wrap{position:absolute;inset:0;display:flex;flex-direction:column;overflow:hidden;background:var(--pv-bg,#2a2a2e);color:var(--pv-fg,#f5f5f5);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;border-radius:inherit;}'
        + '.pv-toolbar{display:flex;align-items:center;gap:4px;flex-wrap:wrap;padding:6px 8px;background:var(--pv-bar,rgba(0,0,0,.35));backdrop-filter:blur(4px);z-index:20;flex:0 0 auto;}'
        + '.pv-toolbar .pv-sep{width:1px;height:18px;background:currentColor;opacity:.2;margin:0 4px;}'
        + '.pv-toolbar .pv-grow{flex:1 1 auto;}'
        + '.pv-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:6px;background:transparent;color:inherit;cursor:pointer;padding:0;opacity:.85;}'
        + '.pv-btn:hover{background:rgba(128,128,128,.25);opacity:1;}'
        + '.pv-btn.pv-active{background:var(--pv-accent,#3b82f6);color:#fff;opacity:1;}'
        + '.pv-btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}'
        + '.pv-input{background:rgba(128,128,128,.18);border:1px solid rgba(128,128,128,.35);color:inherit;border-radius:6px;height:26px;padding:0 6px;font-size:12px;outline:none;}'
        + '.pv-input:focus{border-color:var(--pv-accent,#3b82f6);}'
        + '.pv-pageno{width:40px;text-align:center;}'
        + '.pv-zoomsel{appearance:auto;max-width:110px;}'
        + '.pv-zoomsel option{color:#111;}'
        + '.pv-searchbox{display:inline-flex;align-items:center;gap:2px;}'
        + '.pv-searchbox input{width:120px;}'
        + '.pv-count{opacity:.7;font-size:11px;min-width:34px;text-align:center;}'
        + '.pv-body{display:flex;flex:1 1 auto;min-height:0;position:relative;}'
        + '.pv-sidebar{width:160px;flex:0 0 auto;display:none;flex-direction:column;background:rgba(0,0,0,.25);z-index:10;min-height:0;}'
        + '.pv-sidebar.pv-open{display:flex;}'
        + '.pv-sidetabs{display:flex;flex:0 0 auto;}'
        + '.pv-sidetabs button{flex:1;border:none;background:transparent;color:inherit;opacity:.6;padding:6px 0;cursor:pointer;font-size:11px;border-bottom:2px solid transparent;}'
        + '.pv-sidetabs button.pv-active{opacity:1;border-bottom-color:var(--pv-accent,#3b82f6);}'
        + '.pv-sidecontent{flex:1 1 auto;overflow:auto;padding:8px;min-height:0;}'
        + '.pv-thumb{margin:0 auto 10px;cursor:pointer;border:2px solid transparent;border-radius:4px;overflow:hidden;width:112px;background:#fff;}'
        + '.pv-thumb.pv-active{border-color:var(--pv-accent,#3b82f6);}'
        + '.pv-thumb canvas{display:block;width:108px;}'
        + '.pv-thumb .pv-thumbno{display:block;text-align:center;font-size:10px;color:var(--pv-fg,#f5f5f5);background:transparent;padding:1px 0;}'
        + '.pv-outline{list-style:none;padding-left:10px;margin:0;}'
        + '.pv-outline li{margin:2px 0;}'
        + '.pv-outline a{color:inherit;text-decoration:none;cursor:pointer;font-size:12px;opacity:.85;display:block;padding:2px 4px;border-radius:4px;}'
        + '.pv-outline a:hover{background:rgba(128,128,128,.25);opacity:1;}'
        + '.pv-main{flex:1 1 auto;overflow:auto;position:relative;min-height:0;}'
        + '.pv-pages{position:relative;margin:0 auto;padding:14px 0;width:max-content;min-width:100%;}'
        + '.pv-page{position:relative;margin:0 auto 14px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.4);}'
        + '.pv-page canvas{display:block;}'
        + '.pv-textlayer{position:absolute;inset:0;overflow:hidden;line-height:1;z-index:2;}'
        + '.pv-textlayer span{color:transparent;position:absolute;white-space:pre;cursor:text;transform-origin:0 0;}'
        + '.pv-textlayer ::selection{background:rgba(59,130,246,.35);}'
        + '.pv-textlayer mark{color:transparent;background:var(--pv-accent,#3b82f6);opacity:.45;border-radius:2px;}'
        + '.pv-watermark{position:absolute;inset:0;z-index:6;pointer-events:none;background-repeat:repeat;}'
        + '.pv-protected .pv-textlayer{pointer-events:none;-webkit-user-select:none;user-select:none;}'
        + '.pv-protected{-webkit-user-select:none;user-select:none;}'
        + '.pv-overlay{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:10px;z-index:30;background:var(--pv-bg,#2a2a2e);}'
        + '.pv-overlay.pv-show{display:flex;}'
        + '.pv-spinner{width:34px;height:34px;border:3px solid rgba(128,128,128,.3);border-top-color:var(--pv-accent,#3b82f6);border-radius:50%;animation:pv-spin .8s linear infinite;}'
        + '@keyframes pv-spin{to{transform:rotate(360deg);}}'
        + '.pv-errmsg{max-width:80%;text-align:center;opacity:.85;font-size:13px;}'
        + '.pv-hidden{display:none !important;}';
        var styleEl = document.createElement('style');
        styleEl.id = 'pv-styles';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    }

    // ---------------------------------------------------------------
    // i18n
    // ---------------------------------------------------------------
    var I18N = {
        en: { search:'Search', prevPage:'Previous page', nextPage:'Next page', zoomIn:'Zoom in', zoomOut:'Zoom out',
              fitWidth:'Fit to width', fitPage:'Fit to page', thumbs:'Thumbnails', outline:'Bookmarks',
              fullscreen:'Presentation mode', print:'Print', download:'Download', rotate:'Rotate',
              sidebar:'Toggle sidebar', of:'of', noMatches:'0', loadError:'Unable to load this PDF.',
              pageFit:'Page fit', pageWidth:'Page width' },
        pt: { search:'Buscar', prevPage:'Página anterior', nextPage:'Próxima página', zoomIn:'Aproximar', zoomOut:'Afastar',
              fitWidth:'Ajustar à largura', fitPage:'Ajustar à página', thumbs:'Miniaturas', outline:'Marcadores',
              fullscreen:'Modo apresentação', print:'Imprimir', download:'Baixar', rotate:'Girar',
              sidebar:'Painel lateral', of:'de', noMatches:'0', loadError:'Não foi possível carregar este PDF.',
              pageFit:'Página inteira', pageWidth:'Largura da página' },
        fr: { search:'Rechercher', prevPage:'Page précédente', nextPage:'Page suivante', zoomIn:'Zoom avant', zoomOut:'Zoom arrière',
              fitWidth:'Pleine largeur', fitPage:'Page entière', thumbs:'Vignettes', outline:'Signets',
              fullscreen:'Mode présentation', print:'Imprimer', download:'Télécharger', rotate:'Pivoter',
              sidebar:'Panneau latéral', of:'sur', noMatches:'0', loadError:'Impossible de charger ce PDF.',
              pageFit:'Page entière', pageWidth:'Largeur de page' },
        es: { search:'Buscar', prevPage:'Página anterior', nextPage:'Página siguiente', zoomIn:'Acercar', zoomOut:'Alejar',
              fitWidth:'Ajustar al ancho', fitPage:'Ajustar a la página', thumbs:'Miniaturas', outline:'Marcadores',
              fullscreen:'Modo presentación', print:'Imprimir', download:'Descargar', rotate:'Girar',
              sidebar:'Panel lateral', of:'de', noMatches:'0', loadError:'No se pudo cargar este PDF.',
              pageFit:'Página completa', pageWidth:'Ancho de página' },
        de: { search:'Suchen', prevPage:'Vorherige Seite', nextPage:'Nächste Seite', zoomIn:'Vergrößern', zoomOut:'Verkleinern',
              fitWidth:'Seitenbreite', fitPage:'Ganze Seite', thumbs:'Miniaturen', outline:'Lesezeichen',
              fullscreen:'Präsentationsmodus', print:'Drucken', download:'Herunterladen', rotate:'Drehen',
              sidebar:'Seitenleiste', of:'von', noMatches:'0', loadError:'PDF konnte nicht geladen werden.',
              pageFit:'Ganze Seite', pageWidth:'Seitenbreite' }
    };

    var ICONS = {
        sidebar:  '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/></svg>',
        up:       '<svg viewBox="0 0 24 24"><polyline points="6 14 12 8 18 14"/></svg>',
        down:     '<svg viewBox="0 0 24 24"><polyline points="6 10 12 16 18 10"/></svg>',
        plus:     '<svg viewBox="0 0 24 24"><line x1="12" y1="6" x2="12" y2="18"/><line x1="6" y1="12" x2="18" y2="12"/></svg>',
        minus:    '<svg viewBox="0 0 24 24"><line x1="6" y1="12" x2="18" y2="12"/></svg>',
        fitW:     '<svg viewBox="0 0 24 24"><polyline points="7 8 3 12 7 16"/><polyline points="17 8 21 12 17 16"/><line x1="3" y1="12" x2="21" y2="12"/></svg>',
        fitP:     '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="1.5"/><polyline points="9 9 12 6 15 9"/><polyline points="9 15 12 18 15 15"/></svg>',
        search:   '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><line x1="15.5" y1="15.5" x2="20" y2="20"/></svg>',
        full:     '<svg viewBox="0 0 24 24"><polyline points="4 9 4 4 9 4"/><polyline points="15 4 20 4 20 9"/><polyline points="20 15 20 20 15 20"/><polyline points="9 20 4 20 4 15"/></svg>',
        rotate:   '<svg viewBox="0 0 24 24"><path d="M20 8a8 8 0 1 0 2 6"/><polyline points="20 3 20 8 15 8"/></svg>',
        print:    '<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="5"/><rect x="4" y="8" width="16" height="8" rx="1.5"/><rect x="7" y="14" width="10" height="7"/></svg>',
        download: '<svg viewBox="0 0 24 24"><line x1="12" y1="4" x2="12" y2="15"/><polyline points="7 10 12 15 17 10"/><line x1="5" y1="20" x2="19" y2="20"/></svg>'
    };

    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function(c) {
            return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
        });
    }

    // ---------------------------------------------------------------
    // DOM skeleton
    // ---------------------------------------------------------------
    var wrap = el('div', 'pv-wrap');
    var toolbar = el('div', 'pv-toolbar');
    var body = el('div', 'pv-body');
    var sidebar = el('div', 'pv-sidebar');
    var main = el('div', 'pv-main');
    var pages = el('div', 'pv-pages');
    var watermark = el('div', 'pv-watermark pv-hidden');
    var overlay = el('div', 'pv-overlay');
    var spinner = el('div', 'pv-spinner');
    var errmsg = el('div', 'pv-errmsg pv-hidden');
    overlay.appendChild(spinner);
    overlay.appendChild(errmsg);
    main.appendChild(pages);
    body.appendChild(sidebar);
    body.appendChild(main);
    wrap.appendChild(toolbar);
    wrap.appendChild(body);
    wrap.appendChild(overlay);
    root.appendChild(wrap);

    // Toolbar controls
    var btnSidebar = el('button', 'pv-btn pv-t-sidebar', ICONS.sidebar);
    var btnPrev = el('button', 'pv-btn', ICONS.up);
    var btnNext = el('button', 'pv-btn', ICONS.down);
    var pageInput = el('input', 'pv-input pv-pageno');
    pageInput.type = 'text';
    var pageTotal = el('span', 'pv-count pv-pagetotal', '');
    var btnZoomOut = el('button', 'pv-btn', ICONS.minus);
    var btnZoomIn = el('button', 'pv-btn', ICONS.plus);
    var zoomSel = el('select', 'pv-input pv-zoomsel');
    var btnFitW = el('button', 'pv-btn', ICONS.fitW);
    var btnFitP = el('button', 'pv-btn', ICONS.fitP);
    var btnRotate = el('button', 'pv-btn pv-t-rotate', ICONS.rotate);
    var searchBox = el('span', 'pv-searchbox pv-t-search');
    var searchInput = el('input', 'pv-input');
    searchInput.type = 'text';
    var searchCount = el('span', 'pv-count', '');
    var btnMPrev = el('button', 'pv-btn', ICONS.up);
    var btnMNext = el('button', 'pv-btn', ICONS.down);
    searchBox.appendChild(searchInput);
    searchBox.appendChild(searchCount);
    searchBox.appendChild(btnMPrev);
    searchBox.appendChild(btnMNext);
    var btnFull = el('button', 'pv-btn pv-t-full', ICONS.full);
    var btnPrint = el('button', 'pv-btn pv-t-print', ICONS.print);
    var btnDownload = el('button', 'pv-btn pv-t-download', ICONS.download);

    toolbar.appendChild(btnSidebar);
    toolbar.appendChild(el('span', 'pv-sep'));
    toolbar.appendChild(btnPrev);
    toolbar.appendChild(btnNext);
    toolbar.appendChild(pageInput);
    toolbar.appendChild(pageTotal);
    toolbar.appendChild(el('span', 'pv-sep'));
    toolbar.appendChild(btnZoomOut);
    toolbar.appendChild(zoomSel);
    toolbar.appendChild(btnZoomIn);
    toolbar.appendChild(btnFitW);
    toolbar.appendChild(btnFitP);
    toolbar.appendChild(btnRotate);
    toolbar.appendChild(el('span', 'pv-grow'));
    toolbar.appendChild(searchBox);
    toolbar.appendChild(el('span', 'pv-sep pv-t-full'));
    toolbar.appendChild(btnFull);
    toolbar.appendChild(btnPrint);
    toolbar.appendChild(btnDownload);

    // Sidebar tabs
    var sideTabs = el('div', 'pv-sidetabs');
    var tabThumbs = el('button', 'pv-active');
    var tabOutline = el('button', '');
    sideTabs.appendChild(tabThumbs);
    sideTabs.appendChild(tabOutline);
    var sideContent = el('div', 'pv-sidecontent');
    var thumbsPane = el('div', '');
    var outlinePane = el('div', 'pv-hidden');
    sideContent.appendChild(thumbsPane);
    sideContent.appendChild(outlinePane);
    sidebar.appendChild(sideTabs);
    sidebar.appendChild(sideContent);

    // ---------------------------------------------------------------
    // Viewer object
    // ---------------------------------------------------------------
    var PV = {
        doc: null,               // pdfjs document
        bytes: null,             // pristine copy for pdf-lib / download / print
        numPages: 0,
        current: 1,
        scale: 1,
        fitMode: 'page-width',   // null | 'page-fit' | 'page-width'
        rotation: 0,
        pagesMeta: [],           // {num, wrapper, canvas, textDiv, rendered, rendering, w, h}
        baseDims: null,          // scale-1 dims of page 1 (estimate for placeholders)
        loadToken: 0,
        abortCtrl: null,
        lang: I18N.en,
        opts: {},
        fileName: 'document.pdf',
        searchTerm: '',
        matches: [],             // [{page, count}]
        matchTotal: 0,
        matchPos: 0,             // 1-based position across pages
        pageTexts: {},           // cache of page plain text
        io: null,                // IntersectionObserver for pages
        thumbIo: null,
        blobUrls: []
    };
    instance.data.pv = PV;
    instance.data.created = true;

    function publish(name, val) {
        try { instance.publishState(name, val); } catch (e) {}
    }
    function trigger(name) {
        try { instance.triggerEvent(name); } catch (e) {}
    }
    PV.publish = publish;
    PV.trigger = trigger;

    function setLoading(on) {
        publish('is_loading', !!on);
        errmsg.classList.add('pv-hidden');
        spinner.classList.remove('pv-hidden');
        overlay.classList.toggle('pv-show', !!on);
    }
    function showError(msg) {
        overlay.classList.add('pv-show');
        spinner.classList.add('pv-hidden');
        errmsg.classList.remove('pv-hidden');
        errmsg.textContent = msg;
    }

    // ---------------------------------------------------------------
    // Options (colors, toolbar visibility, language, watermark...)
    // ---------------------------------------------------------------
    PV.applyOptions = function(o) {
        PV.opts = o;
        var langKey = (o.language || (navigator.language || 'en')).toLowerCase().slice(0, 2);
        PV.lang = I18N[langKey] || I18N.en;
        var L = PV.lang;
        btnSidebar.title = L.sidebar; btnPrev.title = L.prevPage; btnNext.title = L.nextPage;
        btnZoomIn.title = L.zoomIn; btnZoomOut.title = L.zoomOut; btnFitW.title = L.fitWidth;
        btnFitP.title = L.fitPage; btnRotate.title = L.rotate; btnFull.title = L.fullscreen;
        btnPrint.title = L.print; btnDownload.title = L.download;
        searchInput.placeholder = L.search;
        tabThumbs.textContent = L.thumbs;
        tabOutline.textContent = L.outline;
        buildZoomOptions();

        // theme + colors
        var theme = (o.theme === 'light') ? 'light' : 'dark';
        var bg = o.backgroundColor || (theme === 'light' ? 'rgba(240,240,243,1)' : 'rgba(42,42,46,1)');
        var fg = o.textColor || (theme === 'light' ? 'rgba(30,30,34,1)' : 'rgba(245,245,245,1)');
        wrap.style.setProperty('--pv-bg', bg);
        wrap.style.setProperty('--pv-fg', fg);
        wrap.style.setProperty('--pv-accent', o.accentColor || 'rgba(59,130,246,1)');
        wrap.style.setProperty('--pv-bar', theme === 'light' ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.35)');

        // toolbar visibility
        toolbar.classList.toggle('pv-hidden', !!o.hideToolbar);
        btnDownload.classList.toggle('pv-hidden', !!o.hideDownload || !!o.protectedMode);
        btnPrint.classList.toggle('pv-hidden', !!o.hidePrint || !!o.protectedMode);
        searchBox.classList.toggle('pv-hidden', !!o.hideSearch);
        btnSidebar.classList.toggle('pv-hidden', !!o.hideSidebarToggle);
        btnFull.classList.toggle('pv-hidden', !!o.hidePresentation);
        tabOutline.classList.toggle('pv-hidden', !!o.hideOutline);

        // watermark
        if (o.watermarkText) {
            var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220">'
                + '<text x="30" y="130" transform="rotate(-30 160 110)" font-size="22" '
                + 'font-family="sans-serif" fill="#555">' + esc(o.watermarkText) + '</text></svg>';
            watermark.style.backgroundImage = "url(\"data:image/svg+xml;utf8," + encodeURIComponent(svg) + "\")";
            watermark.style.opacity = String(o.watermarkOpacity != null ? o.watermarkOpacity : 0.14);
            watermark.classList.remove('pv-hidden');
        } else {
            watermark.classList.add('pv-hidden');
        }

        // protected mode
        wrap.classList.toggle('pv-protected', !!o.protectedMode);

        // sidebar initial visibility
        if (o.showThumbnails != null && !PV._sidebarTouched) {
            sidebar.classList.toggle('pv-open', !!o.showThumbnails);
        }
    };

    wrap.addEventListener('contextmenu', function(ev) {
        if (PV.opts.protectedMode) ev.preventDefault();
    });
    wrap.addEventListener('keydown', function(ev) {
        if (PV.opts.protectedMode && (ev.ctrlKey || ev.metaKey)
            && ['s', 'p', 'c'].indexOf(String(ev.key).toLowerCase()) !== -1) {
            ev.preventDefault();
        }
    }, true);

    // ---------------------------------------------------------------
    // Loading
    // ---------------------------------------------------------------
    PV.clear = function() {
        PV.loadToken++;
        if (PV.abortCtrl) { try { PV.abortCtrl.abort(); } catch (e) {} }
        if (PV.io) { PV.io.disconnect(); PV.io = null; }
        if (PV.thumbIo) { PV.thumbIo.disconnect(); PV.thumbIo = null; }
        if (PV.doc) { try { PV.doc.destroy(); } catch (e) {} PV.doc = null; }
        PV.blobUrls.forEach(function(u) { try { URL.revokeObjectURL(u); } catch (e) {} });
        PV.blobUrls = [];
        PV.bytes = null;
        PV.pagesMeta = [];
        PV.pageTexts = {};
        PV.matches = []; PV.matchTotal = 0; PV.matchPos = 0; PV.searchTerm = '';
        searchCount.textContent = '';
        pages.innerHTML = '';
        pages.appendChild(watermark);
        thumbsPane.innerHTML = '';
        outlinePane.innerHTML = '';
        overlay.classList.remove('pv-show');
        publish('is_valid_pdf', false);
        publish('total_pages', 0);
        publish('current_page', 0);
        publish('search_results_count', 0);
        publish('is_loading', false);
        publish('pdf_title', '');
        publish('pdf_author', '');
    };

    PV.load = function(url, loadOpts) {
        loadOpts = loadOpts || {};
        PV.clear();
        if (!url) return;
        var token = ++PV.loadToken;
        setLoading(true);
        PV.abortCtrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;

        PV.fileName = loadOpts.fileName
            || decodeURIComponent((String(url).split('?')[0].split('#')[0].split('/').pop() || 'document.pdf'));
        if (!/\.pdf$/i.test(PV.fileName)) PV.fileName += '.pdf';

        fetch(url, { signal: PV.abortCtrl && PV.abortCtrl.signal })
            .then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.arrayBuffer();
            })
            .then(function(buf) {
                if (token !== PV.loadToken) return;
                PV.bytes = new Uint8Array(buf).slice();
                return window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
            })
            .then(function(doc) {
                if (!doc || token !== PV.loadToken) return;
                PV.doc = doc;
                PV.numPages = doc.numPages;
                publish('is_valid_pdf', true);
                publish('total_pages', doc.numPages);
                publish('error_message', '');
                doc.getMetadata().then(function(md) {
                    if (token !== PV.loadToken) return;
                    var info = (md && md.info) || {};
                    publish('pdf_title', info.Title || '');
                    publish('pdf_author', info.Author || '');
                }).catch(function() {});
                return doc.getPage(1).then(function(p1) {
                    if (token !== PV.loadToken) return;
                    var vp = p1.getViewport({ scale: 1 });
                    PV.baseDims = { w: vp.width, h: vp.height };
                    buildPages();
                    buildThumbs();
                    buildOutline();
                    var iz = loadOpts.initialZoom || 'auto';
                    if (iz === 'page-fit') PV.fitPage();
                    else if (iz === 'auto' || iz === 'page-width') PV.fitWidth();
                    else PV.setZoom(parseFloat(iz) || 100);
                    setLoading(false);
                    var sp = parseInt(loadOpts.startPage, 10);
                    if (sp && sp > 1 && sp <= PV.numPages) PV.goToPage(sp);
                    else updateCurrent(1, true);
                    trigger('pdf_loaded');
                    if (loadOpts.searchWord) PV.search(loadOpts.searchWord);
                });
            })
            .catch(function(err) {
                if (token !== PV.loadToken) return;
                publish('is_valid_pdf', false);
                publish('total_pages', 0);
                publish('is_loading', false);
                publish('error_message', String((err && err.message) || err));
                showError(PV.lang.loadError);
                trigger('pdf_error');
            });
    };

    // ---------------------------------------------------------------
    // Page layout + lazy rendering
    // ---------------------------------------------------------------
    function pageSize(meta) {
        var w = (meta.w || PV.baseDims.w), h = (meta.h || PV.baseDims.h);
        if (PV.rotation % 180 !== 0) { var t = w; w = h; h = t; }
        return { w: w * PV.scale, h: h * PV.scale };
    }

    function buildPages() {
        pages.innerHTML = '';
        PV.pagesMeta = [];
        PV.io = new IntersectionObserver(function(entries) {
            entries.forEach(function(en) {
                var meta = PV.pagesMeta[parseInt(en.target.getAttribute('data-page'), 10) - 1];
                if (en.isIntersecting) renderPage(meta);
            });
        }, { root: main, rootMargin: '600px 0px' });
        for (var i = 1; i <= PV.numPages; i++) {
            var w = el('div', 'pv-page');
            w.setAttribute('data-page', i);
            var meta = { num: i, wrapper: w, rendered: false, rendering: false, w: 0, h: 0 };
            PV.pagesMeta.push(meta);
            pages.appendChild(w);
            PV.io.observe(w);
        }
        pages.appendChild(watermark);
        layoutPages();
    }

    function layoutPages() {
        PV.pagesMeta.forEach(function(meta) {
            var s = pageSize(meta);
            meta.wrapper.style.width = s.w + 'px';
            meta.wrapper.style.height = s.h + 'px';
        });
    }

    function renderPage(meta) {
        if (!PV.doc || meta.rendering) return;
        if (meta.rendered && meta.renderedScale === PV.scale && meta.renderedRotation === PV.rotation) return;
        meta.rendering = true;
        var token = PV.loadToken;
        PV.doc.getPage(meta.num).then(function(page) {
            if (token !== PV.loadToken) return;
            meta.w = page.getViewport({ scale: 1 }).width;
            meta.h = page.getViewport({ scale: 1 }).height;
            var vp = page.getViewport({ scale: PV.scale, rotation: (page.rotate + PV.rotation) % 360 });
            var s = pageSize(meta);
            meta.wrapper.style.width = s.w + 'px';
            meta.wrapper.style.height = s.h + 'px';
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var canvas = document.createElement('canvas');
            canvas.width = Math.floor(vp.width * dpr);
            canvas.height = Math.floor(vp.height * dpr);
            canvas.style.width = vp.width + 'px';
            canvas.style.height = vp.height + 'px';
            var ctx = canvas.getContext('2d');
            return page.render({
                canvasContext: ctx,
                viewport: vp,
                transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
            }).promise.then(function() {
                if (token !== PV.loadToken) return;
                meta.wrapper.innerHTML = '';
                meta.wrapper.appendChild(canvas);
                meta.canvas = canvas;
                var textDiv = el('div', 'pv-textlayer');
                textDiv.style.setProperty('--scale-factor', vp.scale);
                meta.wrapper.appendChild(textDiv);
                meta.textDiv = textDiv;
                meta.rendered = true;
                meta.renderedScale = PV.scale;
                meta.renderedRotation = PV.rotation;
                meta.rendering = false;
                return page.getTextContent().then(function(tc) {
                    if (token !== PV.loadToken) return;
                    PV.pageTexts[meta.num] = tc.items.map(function(it) { return it.str; }).join(' ');
                    var task = window.pdfjsLib.renderTextLayer({
                        textContentSource: tc, container: textDiv, viewport: vp, textDivs: []
                    });
                    return (task.promise || task).then(function() {
                        if (PV.searchTerm) highlightPage(meta);
                    }).catch(function() {});
                });
            });
        }).catch(function() { meta.rendering = false; });
    }

    // re-render visible pages after zoom/rotation change
    function refresh() {
        layoutPages();
        PV.pagesMeta.forEach(function(meta) {
            if (!meta.rendered) return;
            var r = meta.wrapper.getBoundingClientRect();
            var m = main.getBoundingClientRect();
            if (r.bottom > m.top - 600 && r.top < m.bottom + 600) {
                meta.rendered = false;
                renderPage(meta);
            } else {
                meta.rendered = false;
                meta.wrapper.innerHTML = '';
                meta.canvas = null;
                meta.textDiv = null;
            }
        });
    }

    // ---------------------------------------------------------------
    // Navigation / current page tracking
    // ---------------------------------------------------------------
    function updateCurrent(n, silent) {
        n = Math.max(1, Math.min(PV.numPages || 1, n));
        var changed = n !== PV.current;
        PV.current = n;
        pageInput.value = n;
        pageTotal.textContent = PV.lang.of + ' ' + PV.numPages;
        publish('current_page', n);
        Array.prototype.forEach.call(thumbsPane.children, function(t) {
            t.classList.toggle('pv-active', parseInt(t.getAttribute('data-page'), 10) === n);
        });
        if (changed && !silent) trigger('page_changed');
    }

    var scrollRaf = null;
    main.addEventListener('scroll', function() {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(function() {
            scrollRaf = null;
            if (!PV.pagesMeta.length) return;
            var mid = main.scrollTop + main.clientHeight / 2;
            var best = 1, bestDist = Infinity;
            PV.pagesMeta.forEach(function(meta) {
                var top = meta.wrapper.offsetTop;
                var center = top + meta.wrapper.offsetHeight / 2;
                var d = Math.abs(center - mid);
                if (d < bestDist) { bestDist = d; best = meta.num; }
            });
            if (best !== PV.current) updateCurrent(best);
        });
    });

    PV.goToPage = function(n) {
        n = parseInt(n, 10);
        if (!PV.doc || isNaN(n)) return;
        n = Math.max(1, Math.min(PV.numPages, n));
        var meta = PV.pagesMeta[n - 1];
        if (meta) main.scrollTop = meta.wrapper.offsetTop - 10;
        updateCurrent(n);
    };
    PV.nextPage = function() { PV.goToPage(PV.current + 1); };
    PV.prevPage = function() { PV.goToPage(PV.current - 1); };

    // ---------------------------------------------------------------
    // Zoom
    // ---------------------------------------------------------------
    var ZOOM_STEPS = [25, 33, 50, 67, 75, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400];

    function buildZoomOptions() {
        var cur = zoomSel.value;
        zoomSel.innerHTML = '';
        var o1 = el('option'); o1.value = 'page-width'; o1.textContent = PV.lang.pageWidth;
        var o2 = el('option'); o2.value = 'page-fit'; o2.textContent = PV.lang.pageFit;
        zoomSel.appendChild(o1); zoomSel.appendChild(o2);
        [50, 75, 100, 125, 150, 200, 300].forEach(function(z) {
            var o = el('option'); o.value = z; o.textContent = z + '%';
            zoomSel.appendChild(o);
        });
        if (cur) zoomSel.value = cur;
    }
    buildZoomOptions();

    function syncZoomUI() {
        var pct = Math.round(PV.scale * 100);
        publish('zoom_level', pct);
        if (PV.fitMode) { zoomSel.value = PV.fitMode; return; }
        var opt = zoomSel.querySelector('option[value="' + pct + '"]');
        if (!opt) {
            opt = el('option'); opt.value = pct; opt.textContent = pct + '%';
            opt.setAttribute('data-temp', '1');
            var tmp = zoomSel.querySelector('option[data-temp]');
            if (tmp && tmp !== opt) tmp.remove();
            zoomSel.appendChild(opt);
        }
        zoomSel.value = String(pct);
    }

    function applyScale(scale, fitMode) {
        PV.scale = Math.max(0.1, Math.min(6, scale));
        PV.fitMode = fitMode || null;
        syncZoomUI();
        refresh();
    }
    PV.setZoom = function(pct) {
        pct = parseFloat(pct);
        if (isNaN(pct)) return;
        applyScale(pct / 100, null);
    };
    PV.zoomIn = function() {
        var pct = Math.round(PV.scale * 100);
        var next = ZOOM_STEPS.filter(function(z) { return z > pct; })[0] || pct + 50;
        applyScale(next / 100, null);
    };
    PV.zoomOut = function() {
        var pct = Math.round(PV.scale * 100);
        var arr = ZOOM_STEPS.filter(function(z) { return z < pct; });
        var next = arr.length ? arr[arr.length - 1] : Math.max(10, pct - 25);
        applyScale(next / 100, null);
    };
    PV.fitWidth = function() {
        if (!PV.baseDims) return;
        var w = PV.rotation % 180 !== 0 ? PV.baseDims.h : PV.baseDims.w;
        var avail = Math.max(50, main.clientWidth - 32);
        applyScale(avail / w, 'page-width');
    };
    PV.fitPage = function() {
        if (!PV.baseDims) return;
        var w = PV.rotation % 180 !== 0 ? PV.baseDims.h : PV.baseDims.w;
        var h = PV.rotation % 180 !== 0 ? PV.baseDims.w : PV.baseDims.h;
        var availW = Math.max(50, main.clientWidth - 32);
        var availH = Math.max(50, main.clientHeight - 28);
        applyScale(Math.min(availW / w, availH / h), 'page-fit');
    };
    PV.rotate = function(dir) {
        PV.rotation = (PV.rotation + (dir === 'counterclockwise' ? 270 : 90)) % 360;
        if (PV.fitMode === 'page-width') PV.fitWidth();
        else if (PV.fitMode === 'page-fit') PV.fitPage();
        else refresh();
    };

    if (typeof ResizeObserver !== 'undefined') {
        var ro = new ResizeObserver(function() {
            if (!PV.doc) return;
            if (PV.fitMode === 'page-width') PV.fitWidth();
            else if (PV.fitMode === 'page-fit') PV.fitPage();
        });
        ro.observe(main);
        PV._ro = ro;
    }

    // ---------------------------------------------------------------
    // Search
    // ---------------------------------------------------------------
    function pageText(n) {
        if (PV.pageTexts[n] != null) return Promise.resolve(PV.pageTexts[n]);
        return PV.doc.getPage(n).then(function(p) {
            return p.getTextContent().then(function(tc) {
                var t = tc.items.map(function(it) { return it.str; }).join(' ');
                PV.pageTexts[n] = t;
                return t;
            });
        });
    }
    function countIn(hay, needle) {
        if (!needle) return 0;
        hay = hay.toLowerCase(); needle = needle.toLowerCase();
        var c = 0, i = 0;
        while ((i = hay.indexOf(needle, i)) !== -1) { c++; i += needle.length; }
        return c;
    }
    function highlightPage(meta) {
        if (!meta.textDiv) return;
        var term = PV.searchTerm.toLowerCase();
        Array.prototype.forEach.call(meta.textDiv.querySelectorAll('span'), function(span) {
            var txt = span.textContent;
            if (span.querySelector('mark')) span.textContent = txt;
            if (!term) return;
            var low = txt.toLowerCase();
            if (low.indexOf(term) === -1) return;
            var out = '', i = 0, j;
            while ((j = low.indexOf(term, i)) !== -1) {
                out += esc(txt.slice(i, j)) + '<mark>' + esc(txt.slice(j, j + term.length)) + '</mark>';
                i = j + term.length;
            }
            out += esc(txt.slice(i));
            span.innerHTML = out;
        });
    }
    function refreshHighlights() {
        PV.pagesMeta.forEach(function(meta) { if (meta.rendered) highlightPage(meta); });
    }

    PV.search = function(term) {
        term = String(term == null ? '' : term).trim();
        PV.searchTerm = term;
        searchInput.value = term;
        if (!term || !PV.doc) return PV.clearSearch(!term);
        var token = PV.loadToken;
        var chain = Promise.resolve();
        var results = [];
        var total = 0;
        for (var n = 1; n <= PV.numPages; n++) {
            (function(n) {
                chain = chain.then(function() {
                    if (token !== PV.loadToken) return;
                    return pageText(n).then(function(t) {
                        var c = countIn(t, term);
                        if (c > 0) results.push({ page: n, count: c });
                        total += c;
                    });
                });
            })(n);
        }
        return chain.then(function() {
            if (token !== PV.loadToken) return;
            PV.matches = results;
            PV.matchTotal = total;
            PV.matchPos = total > 0 ? 1 : 0;
            publish('search_results_count', total);
            searchCount.textContent = total > 0 ? PV.matchPos + '/' + total : PV.lang.noMatches;
            refreshHighlights();
            if (results.length) PV.goToPage(results[0].page);
            trigger('search_completed');
        });
    };
    PV.clearSearch = function(skipTermReset) {
        if (!skipTermReset) { PV.searchTerm = ''; searchInput.value = ''; }
        PV.searchTerm = '';
        PV.matches = []; PV.matchTotal = 0; PV.matchPos = 0;
        searchCount.textContent = '';
        publish('search_results_count', 0);
        refreshHighlights();
    };
    function matchPage(pos) {
        // maps a 1-based global match position to its page
        var acc = 0;
        for (var i = 0; i < PV.matches.length; i++) {
            acc += PV.matches[i].count;
            if (pos <= acc) return PV.matches[i].page;
        }
        return PV.matches.length ? PV.matches[PV.matches.length - 1].page : 1;
    }
    PV.nextMatch = function() {
        if (!PV.matchTotal) return;
        PV.matchPos = PV.matchPos >= PV.matchTotal ? 1 : PV.matchPos + 1;
        searchCount.textContent = PV.matchPos + '/' + PV.matchTotal;
        PV.goToPage(matchPage(PV.matchPos));
    };
    PV.prevMatch = function() {
        if (!PV.matchTotal) return;
        PV.matchPos = PV.matchPos <= 1 ? PV.matchTotal : PV.matchPos - 1;
        searchCount.textContent = PV.matchPos + '/' + PV.matchTotal;
        PV.goToPage(matchPage(PV.matchPos));
    };

    // ---------------------------------------------------------------
    // Thumbnails + outline
    // ---------------------------------------------------------------
    function buildThumbs() {
        thumbsPane.innerHTML = '';
        PV.thumbIo = new IntersectionObserver(function(entries) {
            entries.forEach(function(en) {
                if (!en.isIntersecting) return;
                var t = en.target;
                if (t.getAttribute('data-rendered')) return;
                t.setAttribute('data-rendered', '1');
                var n = parseInt(t.getAttribute('data-page'), 10);
                var token = PV.loadToken;
                PV.doc.getPage(n).then(function(page) {
                    if (token !== PV.loadToken) return;
                    var vp1 = page.getViewport({ scale: 1 });
                    var vp = page.getViewport({ scale: 108 / vp1.width });
                    var c = t.querySelector('canvas');
                    c.width = vp.width; c.height = vp.height;
                    page.render({ canvasContext: c.getContext('2d'), viewport: vp });
                }).catch(function() {});
            });
        }, { root: sideContent, rootMargin: '300px 0px' });
        for (var i = 1; i <= PV.numPages; i++) {
            var t = el('div', 'pv-thumb');
            t.setAttribute('data-page', i);
            t.appendChild(document.createElement('canvas'));
            t.appendChild(el('span', 'pv-thumbno', String(i)));
            t.addEventListener('click', function() {
                PV.goToPage(parseInt(this.getAttribute('data-page'), 10));
            });
            thumbsPane.appendChild(t);
            PV.thumbIo.observe(t);
        }
    }

    function buildOutline() {
        outlinePane.innerHTML = '';
        if (!PV.doc) return;
        PV.doc.getOutline().then(function(outline) {
            if (!outline || !outline.length) return;
            var token = PV.loadToken;
            function navTo(dest) {
                Promise.resolve(typeof dest === 'string' ? PV.doc.getDestination(dest) : dest)
                    .then(function(d) {
                        if (!d || token !== PV.loadToken) return;
                        return PV.doc.getPageIndex(d[0]).then(function(idx) {
                            PV.goToPage(idx + 1);
                        });
                    }).catch(function() {});
            }
            function buildList(items) {
                var ul = el('ul', 'pv-outline');
                items.forEach(function(item) {
                    var li = el('li');
                    var a = el('a');
                    a.textContent = item.title || '—';
                    a.addEventListener('click', function() { navTo(item.dest); });
                    li.appendChild(a);
                    if (item.items && item.items.length) li.appendChild(buildList(item.items));
                    ul.appendChild(li);
                });
                return ul;
            }
            outlinePane.appendChild(buildList(outline));
        }).catch(function() {});
    }

    PV.toggleSidebar = function(show) {
        PV._sidebarTouched = true;
        if (show == null) sidebar.classList.toggle('pv-open');
        else sidebar.classList.toggle('pv-open', !!show);
    };

    // ---------------------------------------------------------------
    // Download / print / fullscreen
    // ---------------------------------------------------------------
    function blobUrl(bytes) {
        var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        PV.blobUrls.push(url);
        return url;
    }
    PV.downloadBytes = function(bytes, filename) {
        var a = document.createElement('a');
        a.href = blobUrl(bytes);
        a.download = filename || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    };
    PV.download = function(filename) {
        if (!PV.bytes) return;
        PV.downloadBytes(PV.bytes, filename || PV.opts.renameFile || PV.fileName);
        trigger('download_started');
    };
    PV.print = function() {
        if (!PV.bytes) return;
        trigger('print_started');
        var url = blobUrl(PV.bytes);
        var frame = document.createElement('iframe');
        frame.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;';
        frame.src = url;
        frame.onload = function() {
            setTimeout(function() {
                try {
                    frame.contentWindow.focus();
                    frame.contentWindow.print();
                } catch (e) {
                    try { window.open(url, '_blank'); } catch (e2) {}
                }
            }, 150);
        };
        document.body.appendChild(frame);
        setTimeout(function() { try { frame.remove(); } catch (e) {} }, 120000);
    };
    PV.fullscreen = function() {
        try {
            if (document.fullscreenElement) document.exitFullscreen();
            else wrap.requestFullscreen();
        } catch (e) {}
    };

    // ---------------------------------------------------------------
    // pdf-lib powered tools (extract / merge / fill / stamp)
    // ---------------------------------------------------------------
    function normalizeUrl(u) {
        u = String(u || '').trim();
        if (u.slice(0, 2) === '//') u = 'https:' + u;
        return u;
    }
    function fetchBytes(url) {
        return fetch(normalizeUrl(url)).then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' - ' + url);
            return r.arrayBuffer();
        });
    }
    function parseRanges(str, max) {
        // "1-3,5" -> [0,1,2,4]
        var out = [];
        String(str || '').split(',').forEach(function(part) {
            part = part.trim();
            if (!part) return;
            var m = part.match(/^(\d+)\s*-\s*(\d+)$/);
            if (m) {
                for (var i = parseInt(m[1], 10); i <= parseInt(m[2], 10); i++) {
                    if (i >= 1 && i <= max && out.indexOf(i - 1) === -1) out.push(i - 1);
                }
            } else {
                var n = parseInt(part, 10);
                if (n >= 1 && n <= max && out.indexOf(n - 1) === -1) out.push(n - 1);
            }
        });
        return out;
    }

    PV.extractPages = function(rangesStr, filename) {
        if (!PV.bytes || !window.PDFLib) return Promise.resolve();
        return window.PDFLib.PDFDocument.load(PV.bytes, { ignoreEncryption: true }).then(function(src) {
            var idx = parseRanges(rangesStr, src.getPageCount());
            if (!idx.length) throw new Error('No valid pages in range: ' + rangesStr);
            return window.PDFLib.PDFDocument.create().then(function(out) {
                return out.copyPages(src, idx).then(function(copied) {
                    copied.forEach(function(p) { out.addPage(p); });
                    return out.save();
                });
            });
        }).then(function(bytes) {
            PV.downloadBytes(bytes, filename || 'extracted.pdf');
            trigger('download_started');
        }).catch(function(e) { publish('error_message', String(e && e.message || e)); });
    };

    PV.mergePdfs = function(urlsStr, filename) {
        if (!window.PDFLib) return Promise.resolve();
        var urls = String(urlsStr || '').split(/[\n,]+/).map(function(s) { return s.trim(); }).filter(Boolean);
        if (!urls.length) return Promise.resolve();
        return window.PDFLib.PDFDocument.create().then(function(out) {
            var chain = Promise.resolve();
            urls.forEach(function(u) {
                chain = chain.then(function() {
                    return fetchBytes(u).then(function(buf) {
                        return window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
                    }).then(function(src) {
                        return out.copyPages(src, src.getPageIndices()).then(function(copied) {
                            copied.forEach(function(p) { out.addPage(p); });
                        });
                    });
                });
            });
            return chain.then(function() { return out.save(); });
        }).then(function(bytes) {
            PV.downloadBytes(bytes, filename || 'merged.pdf');
            trigger('download_started');
        }).catch(function(e) { publish('error_message', String(e && e.message || e)); });
    };

    PV.fillForm = function(jsonStr, filename, flatten) {
        if (!PV.bytes || !window.PDFLib) return Promise.resolve();
        var data;
        try { data = JSON.parse(jsonStr || '{}'); }
        catch (e) { publish('error_message', 'Invalid form JSON: ' + e.message); return Promise.resolve(); }
        return window.PDFLib.PDFDocument.load(PV.bytes, { ignoreEncryption: true }).then(function(doc) {
            var form = doc.getForm();
            form.getFields().forEach(function(field) {
                var name = field.getName();
                if (!(name in data)) return;
                var v = data[name];
                var type = field.constructor.name;
                try {
                    if (type === 'PDFTextField') field.setText(String(v));
                    else if (type === 'PDFCheckBox') { if (v) field.check(); else field.uncheck(); }
                    else if (type === 'PDFDropdown' || type === 'PDFRadioGroup') field.select(String(v));
                    else if (type === 'PDFOptionList') field.select(String(v));
                } catch (e) {}
            });
            if (flatten) form.flatten();
            return doc.save();
        }).then(function(bytes) {
            PV.downloadBytes(bytes, filename || 'filled.pdf');
            trigger('download_started');
        }).catch(function(e) { publish('error_message', String(e && e.message || e)); });
    };

    PV.stampImage = function(imageUrl, pageNum, xPct, yPct, widthPct, filename) {
        if (!PV.bytes || !window.PDFLib) return Promise.resolve();
        return fetchBytes(imageUrl).then(function(imgBuf) {
            return window.PDFLib.PDFDocument.load(PV.bytes, { ignoreEncryption: true }).then(function(doc) {
                var isPng = /\.png(\?|#|$)/i.test(imageUrl);
                var embed = isPng ? doc.embedPng(imgBuf) : doc.embedJpg(imgBuf);
                return embed.catch(function() {
                    return isPng ? doc.embedJpg(imgBuf) : doc.embedPng(imgBuf);
                }).then(function(img) {
                    var pi = Math.max(1, Math.min(doc.getPageCount(), parseInt(pageNum, 10) || 1)) - 1;
                    var page = doc.getPage(pi);
                    var pw = page.getWidth(), ph = page.getHeight();
                    var w = (parseFloat(widthPct) || 20) / 100 * pw;
                    var h = w * (img.height / img.width);
                    var x = (parseFloat(xPct) || 0) / 100 * pw;
                    var yTop = (parseFloat(yPct) || 0) / 100 * ph;
                    page.drawImage(img, { x: x, y: ph - yTop - h, width: w, height: h });
                    return doc.save();
                });
            });
        }).then(function(bytes) {
            PV.downloadBytes(bytes, filename || 'stamped.pdf');
            trigger('download_started');
        }).catch(function(e) { publish('error_message', String(e && e.message || e)); });
    };

    // ---------------------------------------------------------------
    // Toolbar wiring
    // ---------------------------------------------------------------
    btnSidebar.addEventListener('click', function() { PV.toggleSidebar(); });
    btnPrev.addEventListener('click', function() { PV.prevPage(); });
    btnNext.addEventListener('click', function() { PV.nextPage(); });
    pageInput.addEventListener('change', function() { PV.goToPage(pageInput.value); });
    pageInput.addEventListener('keydown', function(ev) { if (ev.key === 'Enter') PV.goToPage(pageInput.value); });
    btnZoomIn.addEventListener('click', function() { PV.zoomIn(); });
    btnZoomOut.addEventListener('click', function() { PV.zoomOut(); });
    zoomSel.addEventListener('change', function() {
        var v = zoomSel.value;
        if (v === 'page-fit') PV.fitPage();
        else if (v === 'page-width') PV.fitWidth();
        else PV.setZoom(v);
    });
    btnFitW.addEventListener('click', function() { PV.fitWidth(); });
    btnFitP.addEventListener('click', function() { PV.fitPage(); });
    btnRotate.addEventListener('click', function() { PV.rotate('clockwise'); });
    btnFull.addEventListener('click', function() { PV.fullscreen(); });
    btnPrint.addEventListener('click', function() { PV.print(); });
    btnDownload.addEventListener('click', function() { PV.download(); });
    var searchDebounce = null;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(function() { PV.search(searchInput.value); }, 350);
    });
    searchInput.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') { clearTimeout(searchDebounce); PV.search(searchInput.value); }
    });
    btnMNext.addEventListener('click', function() { PV.nextMatch(); });
    btnMPrev.addEventListener('click', function() { PV.prevMatch(); });
    tabThumbs.addEventListener('click', function() {
        tabThumbs.classList.add('pv-active'); tabOutline.classList.remove('pv-active');
        thumbsPane.classList.remove('pv-hidden'); outlinePane.classList.add('pv-hidden');
    });
    tabOutline.addEventListener('click', function() {
        tabOutline.classList.add('pv-active'); tabThumbs.classList.remove('pv-active');
        outlinePane.classList.remove('pv-hidden'); thumbsPane.classList.add('pv-hidden');
    });

    PV.destroy = function() {
        PV.clear();
        if (PV._ro) { try { PV._ro.disconnect(); } catch (e) {} }
        try { wrap.remove(); } catch (e) {}
    };

    // initial published defaults
    publish('is_valid_pdf', false);
    publish('total_pages', 0);
    publish('current_page', 0);
    publish('zoom_level', 100);
    publish('is_loading', false);
    publish('search_results_count', 0);
}
