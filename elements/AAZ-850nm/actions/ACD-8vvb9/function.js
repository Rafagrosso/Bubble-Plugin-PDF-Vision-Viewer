function(instance, properties, context) {
    var pv = instance.data && instance.data.pv;
    if (!pv) return;
    pv.clearSearch();
}
