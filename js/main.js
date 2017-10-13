$(document).ready(function() {


  $('a.blog-button').click(function() {
    if (currentWidth < 2000) {
      $('.panel-cover').addClass('panel-cover--collapsed');
    } else {
      $('.panel-cover').css('max-width',currentWidth);
      $('.panel-cover').animate({'max-width': '320px', 'width': '22%'}, 400, swing = 'swing', function() {} );
    }
  });

  if (window.location.pathname.substring(0, 5) == "/tag/") {
    $('.panel-cover').addClass('panel-cover--collapsed');
  }
});