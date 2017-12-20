$(function () {

    if (location.href == 'http://arch-long.cn/')
        isDisplayBlog(false);
    else
        isDisplayBlog(true);

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
 * 隐藏欢迎也，显示博客主页。
 */
function isDisplayBlog(flag) {
    if (flag) {
        $(".welcome_index").css("display", "none");
        $(".content_index").css("display", "block");
    } else {
        $(".welcome_index").css("display", "block");
        $(".content_index").css("display", "none");
    }
}