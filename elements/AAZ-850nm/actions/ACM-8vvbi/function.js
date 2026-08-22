function(instance, properties, context) {
    var pv = instance.data && instance.data.pv;
    if (!pv) return;
    pv.mergePdfs(properties.pdf_urls, properties.filename);
}
