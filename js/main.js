$(function () {

    var href = location.href;

    if (href == 'http://arch-long.cn/')
        isDisplayBlog(false);
    else
        isDisplayBlog(true);

    // blog 页面
    if (/http:\/\/arch-long.cn\/articles\/.*/.test(href)) {

        // 加载文章目录结构
        var headArr = new Array();
        var index = 0;
        $("section.post").children().each(function () {
            var node = $(this);
            if ('H2' == node[0].tagName || 'H3' == node[0].tagName) {
                headArr[index] = node;
                index++;
            }
        });
        if (index == 0) { // 如果不包含二级标题和三级标题
            $(".sidebar_right").css("display", "none"); // 隐藏目录栏
            $(".content-wrapper").css("right", "50px");
        } else {
            var currentH2;
            for (var i = 0; i < headArr.length; i++) {
                var node = headArr[i];
                if (node[0].tagName == 'H2') {
                    var html = $(".sidebar_right ol").html() +
                        "<li id='" + i + "'>" +
                        "   <a>" + node.text() +
                        "   </a>" +
                        "   <ol>" +
                        "   </ol>" +
                        "</li>";
                    $(".sidebar_right ol").html(html);
                    currentH2 = $(".sidebar_right ol li#" + i + " ol");
                } else {
                    if (currentH2) {

                        var html = currentH2.html() + "<li><a>" + node.text() + "</a></li>";
                        currentH2.html(html);
                    }
                }
            }
        }

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