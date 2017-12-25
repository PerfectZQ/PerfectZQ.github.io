$(function () {

    var href = location.href;

    if (href == 'http://arch-long.cn/')
        isDisplayBlog(false);
    else
        isDisplayBlog(true);

    // blog 页面
    if (/http:\/\/arch-long.cn\/articles\/.*/.test(href)) {

        /**
         * 加载文章目录结构
         */

        var index = 0;
        var headArr = []; // 存储所有标题节点
        var content = []; // 按结构存储所有标题节点

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
        } else { // 按结构分配标题节点
            var parentNodeIndex = 0;
            var childNodeIndex = 0;
            for (var i = 0; i < headArr.length; i++) {
                var node = headArr[i];
                if (node[0].tagName == 'H2') {
                    childNodeIndex = 0;
                    content[parentNodeIndex] = {'node': node, "childNodes": []};
                    parentNodeIndex++;
                } else { // 子节点
                    if (content[parentNodeIndex - 1]) {
                        content[parentNodeIndex - 1].childNodes[childNodeIndex] = node;
                        childNodeIndex++;
                    }
                }
            }
        }

        // 生成目录
        for (var i = 0; i < content.length; i++) {
            var node = content[i].node;
            var childNodes = content[i].childNodes;
            var html = "";
            for (var j = 0; j < childNodes.length; j++) {
                var childNode = childNodes[j];
                var id = childNode.attr("id");
                html = html +
                    "<li id='content" + (i + 1) + "_" + (j + 1) + "' name='" + (i + 1) + "_" + (j + 1) + "'>" +
                    "   <a href='javascript:void(0);' onclick='scrollToView('" + id + "')'>" + (i + 1) + "." + (j + 1) + ".&nbsp;" + childNode.text() +
                    "   </a>" +
                    "</li>"
            }

            var id = node.attr("id");
            alert(id)
            $(".sidebar_right ol").html(
                $(".sidebar_right ol").html() +
                "<li id='content" + (i + 1) + "' name='" + (i + 1) + "'>" +
                "   <a href='javascript:void(0);' onclick='scrollToView(" + id + ")'>" + (i + 1) + ".&nbsp;" + node.text() +
                "   </a>" +
                "   <ol>" +
                html +
                "   </ol>" +
                "</li>"
            );
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

function scrollToView(id) {
    alert(id)
    $("html, body").animate({
        scrollTop: $("'#" + id + "'").offset().top
    }, {duration: 500, easing: "swing"});
}

