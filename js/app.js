$(function(){

    /**
     * 侧页一级目录点击事件
     */
    $("li.first_content").click(function(){
       var ul = $(this).next();
       var className = ul.attr();
       if(className == 'disappear'){
           ul.removeClass('disappear');
           ul.addClass('appear');
       }else{
           ul.removeClass('appear');
           ul.addClass('disappear');
       }
    });
});