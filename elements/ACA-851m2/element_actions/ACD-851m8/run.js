function(instance, properties, context) {

    if (instance.data.goToPage) {
        instance.data.goToPage((instance.data.currentPage || 1) - 1);
    }

}
