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

});

/**
 * 隐藏首页
 */
function toContentIndex() {
    $(".welcome_index").css("display","none");
    $(".content_index").css("display","block");
}