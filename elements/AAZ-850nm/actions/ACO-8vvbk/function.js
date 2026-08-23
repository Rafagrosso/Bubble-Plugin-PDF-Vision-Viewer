function(instance, properties, context) {
    var pv = instance.data && instance.data.pv;
    if (!pv) return;
    pv.stampImage(properties.image_url, properties.page, properties.x_percent, properties.y_percent, properties.width_percent, properties.filename);
}
