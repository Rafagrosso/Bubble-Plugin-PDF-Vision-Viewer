function(instance, properties, context) {
    var pv = instance.data.pv;
    if (!pv) return;

    // ------------------------------------------------------------------
    // Normalize the PDF URL
    // ------------------------------------------------------------------
    var url = String(properties.pdf_url || '').trim();
    if (url && url.slice(0, 2) === '//') url = 'https:' + url;
    if (url && /\.cdn\.bubble\.io/.test(url) && properties.app_name) {
        // legacy behavior: point CDN urls at the app's own CDN host
        var m = url.match(/\/\/(.*?)\.cdn\.bubble\.io/);
        if (m && m[1] && m[1] !== properties.app_name) {
            url = url.replace(m[1] + '.cdn.bubble.io', properties.app_name + '.cdn.bubble.io');
        }
    }

    // ------------------------------------------------------------------
    // UI options (safe to re-apply on every update, no PDF reload)
    // ------------------------------------------------------------------
    pv.applyOptions({
        language: properties.viewer_language && properties.viewer_language !== 'auto'
            ? properties.viewer_language : '',
        theme: properties.theme || 'dark',
        backgroundColor: properties.background_color,
        textColor: properties.text_color,
        accentColor: properties.accent_color,
        hideToolbar: properties.remove_top_toolbar,
        hideDownload: properties.remove_download,
        hidePrint: properties.remove_print,
        hideSearch: properties.remove_search,
        hideSidebarToggle: properties.remove_left_toggle,
        hidePresentation: properties.remove_presentation_mode,
        hideOutline: properties.remove_bookmark,
        showThumbnails: properties.show_thumbnails,
        protectedMode: properties.protected_mode,
        watermarkText: properties.watermark_text,
        watermarkOpacity: properties.watermark_opacity,
        renameFile: properties.rename_download_file
    });

    // ------------------------------------------------------------------
    // Load / reload only when the URL actually changed
    // ------------------------------------------------------------------
    var initialZoom = properties.initial_zoom && properties.initial_zoom !== 'auto'
        ? properties.initial_zoom
        : (properties.page_to_fit ? 'page-fit' : 'auto');

    if (url !== instance.data.lastUrl) {
        instance.data.lastUrl = url;
        instance.data.lastSearch = properties.search_word || '';
        instance.data.lastStartPage = properties.start_page;
        if (!url) { pv.clear(); return; }
        pv.load(url, {
            startPage: properties.start_page,
            initialZoom: initialZoom,
            searchWord: properties.search_word,
            fileName: properties.rename_download_file
        });
        return;
    }
    if (!url) return;

    // Dynamic changes on an already-loaded document
    var sw = properties.search_word || '';
    if (sw !== instance.data.lastSearch) {
        instance.data.lastSearch = sw;
        if (sw) pv.search(sw); else pv.clearSearch();
    }
    if (properties.start_page !== instance.data.lastStartPage) {
        instance.data.lastStartPage = properties.start_page;
        if (properties.start_page > 0) pv.goToPage(properties.start_page);
    }
}
