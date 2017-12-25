---
layout: post
title: Chrome Extensions Develop
tag: Chrome
---

## 需求
浏览器点击页面元素返回页面元素的xpath表达式

## Chrome Extensions 开发文档（360翻译）
[中文开发文档地址](http://open.chrome.360.cn/extension_dev/overview.html)
## 代码实现

{% highlight javascript %}
// 获取xpath表达式
function readXPath(element) {
    if (element.id !== "") {//判断id属性，如果这个元素有id，则显 示//*[@id="xPath"]  形式内容
        return '//*[@id=\"' + element.id + '\"]';
    }
    //这里需要需要主要字符串转译问题，可参考js 动态生成html时字符串和变量转译（注意引号的作用）
    if (element == document.body) {//递归到body处，结束递归
        return '/html/' + element.tagName.toLowerCase();
    }
    var ix = 1,//在nodelist中的位置，且每次点击初始化
         siblings = element.parentNode.childNodes;//同级的子元素
 
    for (var i = 0, l = siblings.length; i < l; i++) {
        var sibling = siblings[i];
        //如果这个元素是siblings数组中的元素，则执行递归操作
        if (sibling == element) {
            return arguments.callee(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix) + ']';
            //如果不符合，判断是否是element元素，并且是否是相同元素，如果是相同的就开始累加
        } else if (sibling.nodeType == 1 && sibling.tagName == element.tagName) {
            ix++;
        }
    }
}
// 在页面元素中添加点击监听事件
document.addEventListener("click",function(e){console.log(readXPath(e))})
{% endhighlight %}