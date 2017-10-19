$(function () {

    $("body").niceScroll({
        cursorcolor: "#B9D3EE",
        enablescrollonselection: true
    });

    $("pre").niceScroll({
        cursorcolor: "#B9D3EE",
        // 当只有水平滚动时可以用鼠标滚轮来滚动，如果设为false则不支持水平滚动，如果设为auto支持双轴滚动
        oneaxismousemode: "auto",
        enablescrollonselection: true
    });

    /**
     * 侧页一级目录点击事件
     */
    $("li.first_content").click(function () {
        var ul = $(this).children('ul');
        ul.slideToggle('normal');
    });

    /**
     * header 头像点击事件
     */
    $("div.left-avatar").click(function () {
        $("#dropdown-menu").slideToggle('normal');
    });

});

