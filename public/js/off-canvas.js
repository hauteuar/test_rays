(function($) {
  'use strict';
  $(function() {
    $('[data-toggle="offcanvas"]').on("click", function() {
      $('.sidebar-offcanvas').toggleClass('active');
    });

    $(document).on('click', '.pull-bs-canvas-right, .pull-bs-canvas-filter', function(){
      $('body').prepend('<div class="bs-canvas-overlay bg-dark position-fixed w-100 h-100"></div>');
      if($(this).hasClass('pull-bs-canvas-right'))
        $('.bs-canvas-right').addClass('open_canvas');
      else
        $('.bs-canvas-filter').addClass('open_canvas');
      return false;
    });
    
    $(document).on('click', '.bs-canvas-close, .bs-canvas-overlay', function(){
      var elm = $(this).hasClass('bs-canvas-close') ? $(this).closest('.bs-canvas') : $('.bs-canvas');
      elm.removeClass('open_canvas');
      $('.bs-canvas-overlay').remove();
      return false;
    });
  });
})(jQuery);
