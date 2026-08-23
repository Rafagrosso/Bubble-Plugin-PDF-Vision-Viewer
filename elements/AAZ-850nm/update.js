function(instance, properties, context) {
    var pdf_url = properties.pdf_url;
    if (!pdf_url || String(pdf_url).trim() === '') {
        try {
            var idname = "pdf_" + properties.pdf_viewer_id;
            var frame = instance.canvas.find('#' + idname);
            if (!frame || !frame.length) frame = instance.canvas.find('.iframecontent');
            if (frame && frame.length) {
                frame.each(function() { try { this.src = 'about:blank'; } catch(_){} });
                frame.remove();
            }
            instance.publishState && instance.publishState('is_valid_pdf', false);
            instance.publishState && instance.publishState('total_pages', 0);
            instance.data.created = false;
        } catch (e) {
            try { instance.publishState && instance.publishState('is_valid_pdf', false); instance.publishState && instance.publishState('total_pages', 0); } catch(_) {}
            instance.data.created = false;
        }
        return;
    }
    var domain_url = 'https://s3.amazonaws.com/appforest_uf';
    if (/.cdn.bubble.io/.test(pdf_url)){
        domain_url = 'https://'+properties.app_name+'.cdn.bubble.io';
        let result = pdf_url.match(new RegExp("//" + "(.*)" + ".cdn.bubble.io"));
        pdf_url = pdf_url.replace(result[1],properties.app_name);
    }
    var textname = "pdf_"+properties.pdf_viewer_id;
    var url_params  = properties.remove_top_toolbar ? '&toolbar=1' : '';
  	url_params +=  properties.remove_bookmark ? '&bookmark=1' : '';
    url_params +=  properties.remove_left_toggle ? '&lefttoggle=1' : '';
    url_params +=  properties.background_color ? '&bgcolor='+properties.background_color.replace('#','') : '';
    url_params +=  properties.text_color ? '&textcolor='+properties.text_color.replace('#','') : '';
    url_params +=  properties.remove_presentation_mode ? '&presentation=1' : '';
    url_params +=  properties.remove_search ? '&rsearch=1' : '';
    url_params +=  properties.remove_download ? '&download=1' : '';
    url_params +=  properties.remove_print ? '&print=1' : '';
    url_params +=  properties.remove_file_open ? '&open=1' : '';
    url_params +=  properties.remove_right_toggle ? '&righttoggle=1' : '';
    var page_to_fit =  properties.page_to_fit ? '&zoom=page-fit' : '';
    var language = properties.viewer_language ? properties.viewer_language : 'en-US';
    const { PDFDocument} = PDFLib;
    var checkpdf;
    var pages = 0;
    var xhr = new XMLHttpRequest();
    xhr.onload = async function () {
		await PDFDocument.load(new Uint8Array(xhr.response),{ ignoreEncryption: true })
        .then(function(pdf) {
          	pages = pdf.getPages();
            updatePdfParam(true,pages.length);
            if(!instance.data.created){
              instance.data.created=true;
                pdf_url = pdf_url+(properties.rename_download_file ? '&downloadfname='+properties.rename_download_file : '')+(properties.search_word != "" && properties.search_word != null ? '&search='+properties.search_word : '')+'#page='+(properties.start_page > 0 && properties.start_page <= pages.length ? properties.start_page : 1)+'&locale='+language;
              var pdfviewer_ele = $('<iframe class="iframecontent" id="'+textname+'" src="'+domain_url+'/f1694536583470x901062478942919300/viewer.html?'+url_params+'&file='+pdf_url+page_to_fit+'"  width="100%" height="100%" frameborder="0" allowfullscreen></iframe>');
              instance.canvas.append(pdfviewer_ele);
            }else{
                pdf_url = pdf_url+(properties.rename_download_file ? '&downloadfname='+properties.rename_download_file : '')+(properties.search_word != ""  && properties.search_word != null ? '&search='+properties.search_word : '')+'#page='+(properties.start_page > 0 && properties.start_page <= pages.length ? properties.start_page : 1)+'&locale='+language;
                $('#'+textname).attr('src', domain_url+"/f1694536583470x901062478942919300/viewer.html?"+url_params+'&file='+pdf_url+page_to_fit);
            }
        }).catch(function(err) {
            updatePdfParam(false,0);
        });
    };
    try {
        xhr.open('GET', pdf_url);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    }catch (ex) {
        checkpdf = false;
        updatePdfParam(false,0);
    }
    function updatePdfParam(valid_pdf,t_page){
        instance.publishState('is_valid_pdf',valid_pdf);
    	instance.publishState('total_pages',t_page);
    }
}
