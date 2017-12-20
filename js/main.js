$(function () {

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

    // 从其他页面跳转刷新页面执行。
    if (location.hash && location.hash == "#blog") {
        var welcome_index = $(".welcome_index");
        var content_index = $(".content_index");
        if (welcome_index.hasClass("disappear")) return;
        welcome_index.addClass("disappear");
        content_index.removeClass("disappear");
    }


});

/**
 * 隐藏首页
 */
function toBlog() {
    if (location.hash && location.hash == "#blog") return;
    var welcome_index = $(".welcome_index");
    var content_index = $(".content_index");
    if (welcome_index.hasClass("disappear")) return;
    welcome_index.addClass("disappear");
    content_index.removeClass("disappear");
}