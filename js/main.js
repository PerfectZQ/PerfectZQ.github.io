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

    $("a.blog-button").click(function () {
        // 如果目前已经在 #blog 直接返回
        if (location.hash && location.hash == "#blog") {
            var welcome_index = $(".welcome_index");
            var content_index = $(".content_index");
            if (welcome_index.hasClass("disappear")) return;
            welcome_index.addClass("disappear");
            content_index.removeClass("disappear");
        }
    });

});

/**
 * 隐藏首页
 */
function toPostContentIndex() {
    $(".welcome_index").css("display", "none");
    $(".content_index").css("display", "block");

}