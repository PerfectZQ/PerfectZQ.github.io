$(function () {

    $("body").niceScroll({
        cursorcolor: "#B9D3EE"
    });

    $("pre").niceScroll({
        cursorcolor: "#B9D3EE"
    });

    /**
     * 侧页一级目录点击事件
     */
    $("li.first_content").click(function () {
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

