$(function () {

    var href = location.href;

    if (href === 'http://arch-long.cn/' || href === 'https://arch-long.cn/')
        isDisplayBlog(false);
    else
        isDisplayBlog(true);

    window.onresize = function () {
        if (window.innerWidth <= 1100) $(".header .side-change-container .menu-btn i").attr("class", "fas fa-angle-double-right");
        else $(".header .side-change-container .menu-btn i").attr("class", "fas fa-angle-double-left");
    }


    /**
     * 对博客目录进行重新排序
     */
    var blogList = $(".sidebar-container .first_content");
    var blogIDs = [];
    blogList.each(function () {
        blogIDs.push($(this).attr("id"));
    });
    blogIDs.sort();
    var newBlogListHtml = "";
    for (var i = 0; i < blogIDs.length; i++) {
        newBlogListHtml += "<li class='first_content' id='" + blogIDs[i] + "'>"
            + $("#" + blogIDs[i]).html()
            + "</li>";
    }
    $(".sidebar-container ul#sidebar-menu").html(newBlogListHtml);

    /**
     * 博客目录一级目录点击事件
     */
    $("li.first_content").click(function () {
        var ul = $(this).children('ul');
        ul.slideToggle('normal');
    });

    /**
     * 博客目录开关点击事件
     */
    $(".header button.menu-btn i").click(function () {
        var width = $(".sidebar").width();
        isDisplayLeftContent(width == 0);
    });


    // blog 页面
    if (/http[s]?:\/\/arch-long.cn\/articles\/.*/.test(href)) {

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

        /**
         *  生成文章目录
         */

        for (var i = 0; i < content.length; i++) {
            var node = content[i].node;
            var childNodes = content[i].childNodes;
            var html = "";
            for (var j = 0; j < childNodes.length; j++) {
                var childNode = childNodes[j];
                var id = childNode.attr("id");
                html = html +
                    "<li id='content" + (i + 1) + "_" + (j + 1) + "' name='" + (i + 1) + "_" + (j + 1) + "'>" +
                    "   <a href='javascript:void(0);' onclick=scrollToView('" + id + "')>" + (i + 1) + "." + (j + 1) + "." + childNode.text() +
                    "   </a>" +
                    "</li>"
            }

            var id = node.attr("id");
            $(".sidebar_right ol").html(
                $(".sidebar_right ol").html() +
                "<li id='content" + (i + 1) + "' name='" + (i + 1) + "'>" +
                "   <a href='javascript:void(0);' onclick=scrollToView('" + id + "')>" + (i + 1) + "." + node.text() +
                "   </a>" +
                "   <ol>" +
                html +
                "   </ol>" +
                "</li>"
            );
        }
    }

    // 改变字体
    fontLoad();
});

/**
 * 隐藏欢迎页面，显示博客主页。
 * @param flag 是否显示博客主页
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

/**
 * 目录定位
 * @param id 要滚动到的元素的id
 */
function scrollToView(id) {
    $("html, body").animate(
        {scrollTop: $("#" + id).offset().top - 80},
        {duration: 500, easing: "swing"}
    );
}

/**
 * @param flag 是否显示左侧目录
 */
function isDisplayLeftContent(flag) {
    var windowWidth = $(window).width();
    if (flag) {
        $(".header .side-change-container .menu-btn i").attr("class", "fas fa-angle-double-left");
        $(".header").animate(
            {left: "255px"},
            {duration: 50, easing: "swing"}
        );
        $(".sidebar").animate(
            {width: "255px"},
            {
                duration: 300, easing: "swing", complete:
                    function () {
                        $(".sidebar-header").css("display", "block");
                        $(".sidebar-container").css("display", "block");
                    }
            }
        );
        if (windowWidth >= 1100) {
            $(".content-wrapper").animate(
                {left: "310px"},
                {duration: 300, easing: "swing"}
            );
        }
        if (windowWidth < 1100) {
            $(".header .top-right-menu").css("display", "none");
            $(".content-wrapper").css("display", "none");
        }
    } else {
        $(".header .side-change-container .menu-btn i").attr("class", "fas fa-angle-double-right");
        $(".header").animate(
            {left: "0px"},
            {duration: 50, easing: "swing"}
        );
        $(".sidebar").animate(
            {width: "0px"},
            {
                duration: 300, easing: "swing", complete:
                    function () {
                        if (windowWidth < 1100) {
                            $(".header .top-right-menu").css("display", "block");
                            $(".content-wrapper").css("display", "block");
                        }
                    }
            }
        );
        if (windowWidth >= 1100) {
            $(".content-wrapper").animate(
                {left: "55px"},
                {duration: 300, easing: "swing"}
            );
        }
        else {
            $(".content-wrapper").animate(
                {left: "20px"},
                {duration: 300, easing: "swing"}
            );
        }
        $(".sidebar-header").css("display", "none");
        $(".sidebar-container").css("display", "none");
    }
}

/**
 * 根据浏览器和操作系统选择字体
 */
function fontLoad() {
    var explorer = getExplorer();
    var system = getSystem();
    if (explorer === "Chrome" && system === "Mac") {
        $("html").css({"font-family": 'Microsoft YaHei'});
    } else {
        $("html").css({
            "font-family": 'Roboto, Arial',
            "font-weight": 400
            });
        $(".sidebar_right").css({"font-family": 'Arial'});
        $(".sidebar-container").css({"font-family": 'Arial'});
        $("h1").css({"font-family": 'Arial'});
        $("h2").css({"font-family": 'Arial'});
        $("h3").css({"font-family": 'Arial'});
        $("h4").css({"font-family": 'Arial'});
        $("h5").css({"font-family": 'Arial'});
        $("h6").css({"font-family": 'Arial'});
    }
}

/**
 * 判断浏览器类型
 */
function getExplorer() {
    var explorer = window.navigator.userAgent;
    if (explorer.indexOf("MSIE") >= 0) return "IE";
    else if (explorer.indexOf("Firefox") >= 0) return "Firefox";
    else if (explorer.indexOf("Chrome") >= 0) return "Chrome";
    else if (explorer.indexOf("Opera") >= 0) return "Opera";
    else if (explorer.indexOf("Safari") >= 0) return "Safari";
    return "Other";
}

/**
 * 判断操作系统
 */
function getSystem() {
    var system = navigator.platform;
    if (system.indexOf("Win") >= 0) return "Win";
    else if (system.indexOf("Mac") >= 0) return "Mac";
    else if (system.indexOf("X11") >= 0) return "Unix";
    else if (system.indexOf("Linux") >= 0) return "Linux";
    return "Other";
}