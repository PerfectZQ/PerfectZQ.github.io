$(function () {

    if (location.href == 'http://arch-long.cn/') {
        $(".welcome_index").css("display", "block");
        $(".content_index").css("display", "none");
    }

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
    // var pattern = /http:\/\/arch-long.cn\/page\/\d\/#blog/;
    // if (location.href == 'http://arch-long.cn/#blog' || pattern.test(location.href)) toBlog();


});

/**
 * 隐藏欢迎也，显示博客主页。
 */
function toBlog() {
    $(".welcome_index").css("display", "none");
    $(".content_index").css("display", "block");
}