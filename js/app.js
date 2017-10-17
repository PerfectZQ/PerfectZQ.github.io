$(function () {

    $(".sidebar-container").niceScroll(".menu");
    $("body").niceScroll();

    /**
     * 侧页一级目录点击事件
     */
    $("li.first_content").click(function () {
        $(".sidebar-container").getNiceScroll(".menu").show();
        $(".sidebar-container").getNiceScroll(".menu").resize();
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

