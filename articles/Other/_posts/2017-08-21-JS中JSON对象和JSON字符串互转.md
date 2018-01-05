---
layout: post
title: Json和Json字符串的相互转换
tag: JavaScript
---

## JS对象转换成JSON字符串
```javascript
// 声明一个 js 对象
var jsonObj = {};  
jsonObj.testArray = [1,2,3,4,5];  
jsonObj.name = 'jsonObj';  
// jsonObj.toString() 无效，需要使用下面的方法
var jsonStr = JSON.stringify(jsonObj);  
alert(jsonStr);  // 输出 {"testArray":[1,2,3,4,5],"name":"jsonObj"}
```
下面的写法等同于上面的写法
```javascript
// 声明一个 js 对象
person=new Object();
person.firstname="Bill";
person.lastname="Gates";
person.age=56;
person.eyecolor="blue";
jsonStr = JSON.stringify(person);
alert(jsonStr);  
```
## 将JSON字符串转换成JSON对象
```javascript
// 声明一个 json 字符串
var jsonStr = `{"testArray":[1,2,3,4,5],"name":"jsonObj"}`; 
var jsonObj = JSON.parse(jsonStr);
alert(jsonObj) // 输出[object Object]
```