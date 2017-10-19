$(function () {

    $("body").niceScroll({
        cursorcolor: "#B9D3EE"
    });

    $("pre").niceScroll({
        cursorcolor: "#B9D3EE",
        // 当只有水平滚动时可以用鼠标滚轮来滚动，如果设为false则不支持水平滚动，如果设为auto支持双轴滚动
        oneaxismousemode: "auto"
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

    /**
     * header 头像点击事件
     */
    $("div.left-avatar").click(function () {
        var dropdown_menu = $("#dropdown-menu");
        var className = dropdown_menu.attr('class');
        if (className == 'disappear') {
            dropdown_menu.removeClass('disappear');
            dropdown_menu.addClass('appear');
        } else {
            dropdown_menu.removeClass('appear');
            dropdown_menu.addClass('disappear');
        }
    });
});

