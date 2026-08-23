try {
    if (instance.data.pv) instance.data.pv.clear();
    instance.data.lastUrl = null;
    instance.data.lastSearch = null;
} catch (e) {
    console.log('PDF Vision Viewer - reset error:', e);
}
