$(function () {

    $(".sidebar-container").niceScroll(".menu",
        {
            railoffset: top,
            nativeparentscrolling: true
        }
    );
    $("body").niceScroll();

    /**
     * 侧页一级目录点击事件
     */
    $("li.first_content").click(function () {
        $('.sidebar-container').getNiceScroll().show();
        $('.sidebar-container').getNiceScroll().resize();
        var ul = $(this).children('ul');
        var className = ul.attr('class');
        if (className == 'disappear') {
            ul.removeClass('disappear');
            ul.addClass('appear');
        } else {
            ul.removeClass('appear');
            ul.addClass('disappear');
        }
    });

});

