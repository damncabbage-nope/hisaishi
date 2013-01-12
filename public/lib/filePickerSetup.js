var filePickerSetup = function(elem) {
  var self = elem;
          
  var filePathContainer = $(self).find('.upload-path');
  var filePicker = $(self).find('.upload-picker');
  
  filePathContainer.hide();
  
  var currentFile = $('<a>', {
    class: 'current-file', 
    text: filePathContainer.val(),
    href: filePathContainer.val(),
    target: '_blank'
  });
  
  var uploadButton = $('<button>', {
    text: 'Upload',
    'class': 'upload-trigger',
    'data-source': $(self).find('.upload-picker').attr('id'),
    'data-destination': $(self).find('.upload-path').attr('id'),
    disabled: 'disabled'
  });
  
  var progressIndicator = $('<progress>');
  
  var progressHandler = function(e){
    if(e.lengthComputable){
      $('progress').attr({value:e.loaded,max:e.total});
    }
  }
  
  var sendFile = function(e){
    e.preventDefault();
    
    $(this).siblings('progress').show();
    
    var formData = new FormData();
    formData.append('file_source', filePicker.get(0).files[0]);
    
    $.ajax({
      url: '/admin/upload',
      type: 'POST',
      dataType: 'json', 
      xhr: function() {
        myXhr = $.ajaxSettings.xhr();
        if(myXhr.upload) {
          myXhr.upload.addEventListener('progress', progressHandler, false); // for handling the progress of the upload
        }
        return myXhr;
      },
      success: function(data, textStatus, xhr){
        filePathContainer.val(data.filepath);
        
        // Set filename display
        $(self).find('.current-file').text(data.filepath).attr('href', data.filepath);
        
        // Reset upload trigger
        $(self).find('button.upload-trigger').attr('disabled', 'disabled');
        
        // Hide progress bar
        $(self).find('progress').hide();
        
        // Reset input
        filePicker.val('');
      },
      data: formData,
      cache: false,
      contentType: false,
      processData: false
    });
  };
  
  uploadButton.click(sendFile);
  filePicker.change(function(){
    $(this).siblings('button:disabled').removeAttr('disabled');
  });
  
  progressIndicator.hide();
  filePicker.before(currentFile).after(progressIndicator).after(uploadButton);
};