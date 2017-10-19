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
        ul.slideToggle('slow');
    });

    /**
     * header 头像点击事件
     */
    $("div.left-avatar").click(function () {
        $("#dropdown-menu").slideToggle('slow');
    });

    $("div.top-right-menu").on("mouseover",function(){
        $("#dropdown-menu").slideDown('normal');
    });

    $("div.top-right-menu").on("mouseout",function(){
        $("#dropdown-menu").slideUp('normal');
    });

});

